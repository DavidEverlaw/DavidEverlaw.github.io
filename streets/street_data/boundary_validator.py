#!/usr/bin/env python3
"""
City Boundary Validator and Fixer
==================================

This script validates and fixes topology issues in GeoJSON boundary data.
It can detect and repair common problems like self-intersections, invalid
winding order, and malformed polygons.

Author: Street Names Challenge Team
License: MIT
"""

import json
import logging
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse

try:
    from shapely.geometry import Polygon, MultiPolygon, Point, shape
    from shapely.ops import unary_union
    from shapely.validation import explain_validity, make_valid
    SHAPELY_AVAILABLE = True
except ImportError:
    SHAPELY_AVAILABLE = False
    print("Warning: Shapely not available. Install with: pip install shapely")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BoundaryValidator:
    """Validates and fixes topology issues in GeoJSON boundary data."""
    
    def __init__(self):
        if not SHAPELY_AVAILABLE:
            raise ImportError("Shapely is required for boundary validation. Install with: pip install shapely")
    
    def validate_geojson_file(self, filepath: str) -> Dict:
        """Validate a GeoJSON boundary file and return detailed analysis."""
        logger.info(f"Validating boundary file: {filepath}")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                geojson_data = json.load(f)
        except Exception as e:
            return {
                'valid': False,
                'error': f"Failed to load file: {e}",
                'issues': [],
                'geometry': None
            }
        
        return self.validate_geojson(geojson_data, filepath)
    
    def validate_geojson(self, geojson_data: Dict, source_name: str = "data") -> Dict:
        """Validate GeoJSON data and return detailed analysis."""
        issues = []
        
        # Extract feature
        try:
            if geojson_data.get('type') == 'FeatureCollection':
                if not geojson_data.get('features'):
                    return {
                        'valid': False,
                        'error': "FeatureCollection has no features",
                        'issues': [],
                        'geometry': None
                    }
                feature = geojson_data['features'][0]
            else:
                feature = geojson_data
            
            geometry = feature.get('geometry')
            if not geometry:
                return {
                    'valid': False,
                    'error': "No geometry found in feature",
                    'issues': [],
                    'geometry': None
                }
            
        except Exception as e:
            return {
                'valid': False,
                'error': f"Failed to parse GeoJSON structure: {e}",
                'issues': [],
                'geometry': None
            }
        
        # Create Shapely geometry
        try:
            shapely_geom = shape(geometry)
        except Exception as e:
            return {
                'valid': False,
                'error': f"Failed to create Shapely geometry: {e}",
                'issues': [],
                'geometry': geometry
            }
        
        # Basic validation
        is_valid = shapely_geom.is_valid
        validity_reason = explain_validity(shapely_geom) if not is_valid else "Valid"
        
        # Detailed analysis
        analysis = self._analyze_geometry(shapely_geom, geometry)
        issues.extend(analysis['issues'])
        
        # Check for common problems
        topology_issues = self._check_topology_issues(shapely_geom, geometry)
        issues.extend(topology_issues)
        
        return {
            'valid': is_valid,
            'validity_reason': validity_reason,
            'issues': issues,
            'geometry': geometry,
            'analysis': analysis,
            'shapely_geometry': shapely_geom,
            'source': source_name
        }
    
    def _analyze_geometry(self, shapely_geom, geojson_geom: Dict) -> Dict:
        """Perform detailed analysis of the geometry."""
        issues = []
        
        geom_type = geojson_geom['type']
        coordinates = geojson_geom['coordinates']
        
        analysis = {
            'type': geom_type,
            'area': shapely_geom.area,
            'bounds': shapely_geom.bounds,
            'centroid': [shapely_geom.centroid.x, shapely_geom.centroid.y],
            'is_simple': shapely_geom.is_simple,
            'is_ring': False,
            'coordinate_count': 0,
            'polygon_count': 0,
            'issues': []
        }
        
        if geom_type == 'Polygon':
            analysis['polygon_count'] = 1
            exterior = coordinates[0]
            analysis['coordinate_count'] = len(exterior)
            
            # Check if exterior ring is closed
            if len(exterior) < 4:
                issues.append("Polygon exterior ring has fewer than 4 coordinates")
            elif exterior[0] != exterior[-1]:
                issues.append("Polygon exterior ring is not closed (first != last coordinate)")
            
            # Check interior rings
            if len(coordinates) > 1:
                analysis['hole_count'] = len(coordinates) - 1
                for i, interior in enumerate(coordinates[1:], 1):
                    if len(interior) < 4:
                        issues.append(f"Interior ring {i} has fewer than 4 coordinates")
                    elif interior[0] != interior[-1]:
                        issues.append(f"Interior ring {i} is not closed")
                    analysis['coordinate_count'] += len(interior)
            else:
                analysis['hole_count'] = 0
                
            # Check winding order
            try:
                exterior_ring = Polygon(exterior)
                if not exterior_ring.exterior.is_ccw:
                    issues.append("Exterior ring has clockwise winding (should be counter-clockwise)")
            except:
                issues.append("Could not determine winding order of exterior ring")
        
        elif geom_type == 'MultiPolygon':
            analysis['polygon_count'] = len(coordinates)
            total_coords = 0
            
            for i, polygon_coords in enumerate(coordinates):
                exterior = polygon_coords[0]
                total_coords += len(exterior)
                
                if len(exterior) < 4:
                    issues.append(f"Polygon {i} exterior ring has fewer than 4 coordinates")
                elif exterior[0] != exterior[-1]:
                    issues.append(f"Polygon {i} exterior ring is not closed")
                
                # Check interior rings
                for j, interior in enumerate(polygon_coords[1:], 1):
                    if len(interior) < 4:
                        issues.append(f"Polygon {i} interior ring {j} has fewer than 4 coordinates")
                    elif interior[0] != interior[-1]:
                        issues.append(f"Polygon {i} interior ring {j} is not closed")
                    total_coords += len(interior)
            
            analysis['coordinate_count'] = total_coords
        
        # Check for suspicious characteristics
        if analysis['coordinate_count'] > 50000:
            issues.append(f"Very high coordinate count ({analysis['coordinate_count']:,}) may indicate over-detailed boundary")
        
        if analysis['area'] > 1.0:  # Very rough check for degrees
            issues.append(f"Very large area ({analysis['area']:.2f}) may indicate incorrect boundary")
        
        analysis['issues'] = issues
        return analysis
    
    def _check_topology_issues(self, shapely_geom, geojson_geom: Dict) -> List[str]:
        """Check for specific topology issues."""
        issues = []
        
        # Self-intersection check
        if not shapely_geom.is_simple:
            issues.append("Geometry has self-intersections")
        
        # Empty geometry check
        if shapely_geom.is_empty:
            issues.append("Geometry is empty")
        
        # Check for duplicate consecutive points
        coords_issues = self._check_coordinate_issues(geojson_geom)
        issues.extend(coords_issues)
        
        return issues
    
    def _check_coordinate_issues(self, geojson_geom: Dict) -> List[str]:
        """Check for coordinate-level issues."""
        issues = []
        coordinates = geojson_geom['coordinates']
        geom_type = geojson_geom['type']
        
        def check_ring(ring_coords, ring_name):
            ring_issues = []
            for i in range(len(ring_coords) - 1):
                if ring_coords[i] == ring_coords[i + 1]:
                    ring_issues.append(f"{ring_name} has duplicate consecutive coordinates at position {i}")
            
            # Check for very close points (potential precision issues)
            close_threshold = 1e-10
            for i in range(len(ring_coords) - 1):
                p1, p2 = ring_coords[i], ring_coords[i + 1]
                if abs(p1[0] - p2[0]) < close_threshold and abs(p1[1] - p2[1]) < close_threshold:
                    ring_issues.append(f"{ring_name} has very close consecutive coordinates at position {i}")
            
            return ring_issues
        
        if geom_type == 'Polygon':
            issues.extend(check_ring(coordinates[0], "Exterior ring"))
            for i, interior in enumerate(coordinates[1:], 1):
                issues.extend(check_ring(interior, f"Interior ring {i}"))
        
        elif geom_type == 'MultiPolygon':
            for i, polygon_coords in enumerate(coordinates):
                issues.extend(check_ring(polygon_coords[0], f"Polygon {i} exterior ring"))
                for j, interior in enumerate(polygon_coords[1:], 1):
                    issues.extend(check_ring(interior, f"Polygon {i} interior ring {j}"))
        
        return issues
    
    def fix_geometry(self, validation_result: Dict) -> Optional[Dict]:
        """Attempt to fix geometry issues."""
        if not validation_result.get('shapely_geometry'):
            logger.error("No Shapely geometry available for fixing")
            return None
        
        shapely_geom = validation_result['shapely_geometry']
        
        logger.info("Attempting to fix geometry issues...")
        
        try:
            # Use Shapely's make_valid function
            fixed_geom = make_valid(shapely_geom)
            
            if fixed_geom.is_valid:
                logger.info("Successfully fixed geometry using make_valid()")
                
                # Convert back to GeoJSON
                if hasattr(fixed_geom, '__geo_interface__'):
                    fixed_geojson = fixed_geom.__geo_interface__
                else:
                    # Fallback for older Shapely versions
                    import geojson
                    fixed_geojson = geojson.loads(geojson.dumps(fixed_geom))
                
                return {
                    'geometry': fixed_geojson,
                    'method': 'make_valid',
                    'original_valid': shapely_geom.is_valid,
                    'fixed_valid': fixed_geom.is_valid,
                    'area_change': abs(fixed_geom.area - shapely_geom.area),
                    'bounds_change': self._calculate_bounds_change(shapely_geom.bounds, fixed_geom.bounds)
                }
            else:
                logger.warning("make_valid() did not produce a valid geometry")
        
        except Exception as e:
            logger.error(f"Failed to fix geometry with make_valid(): {e}")
        
        # Try buffer(0) method as fallback
        try:
            logger.info("Trying buffer(0) method...")
            fixed_geom = shapely_geom.buffer(0)
            
            if fixed_geom.is_valid and not fixed_geom.is_empty:
                logger.info("Successfully fixed geometry using buffer(0)")
                
                fixed_geojson = fixed_geom.__geo_interface__
                return {
                    'geometry': fixed_geojson,
                    'method': 'buffer(0)',
                    'original_valid': shapely_geom.is_valid,
                    'fixed_valid': fixed_geom.is_valid,
                    'area_change': abs(fixed_geom.area - shapely_geom.area),
                    'bounds_change': self._calculate_bounds_change(shapely_geom.bounds, fixed_geom.bounds)
                }
        
        except Exception as e:
            logger.error(f"Failed to fix geometry with buffer(0): {e}")
        
        logger.error("Could not fix geometry with available methods")
        return None
    
    def _calculate_bounds_change(self, bounds1: Tuple, bounds2: Tuple) -> float:
        """Calculate the change in bounds between two geometries."""
        return sum(abs(a - b) for a, b in zip(bounds1, bounds2))
    
    def save_fixed_boundary(self, original_file: str, fixed_geometry: Dict, fix_info: Dict) -> str:
        """Save the fixed boundary to a new file."""
        # Create output filename
        path = Path(original_file)
        output_file = path.parent / f"{path.stem}_fixed{path.suffix}"
        
        # Load original data to preserve properties
        with open(original_file, 'r', encoding='utf-8') as f:
            original_data = json.load(f)
        
        # Update geometry
        if original_data.get('type') == 'FeatureCollection':
            original_data['features'][0]['geometry'] = fixed_geometry
            # Add fix info to properties
            if 'properties' not in original_data['features'][0]:
                original_data['features'][0]['properties'] = {}
            original_data['features'][0]['properties']['fix_info'] = fix_info
        else:
            original_data['geometry'] = fixed_geometry
            if 'properties' not in original_data:
                original_data['properties'] = {}
            original_data['properties']['fix_info'] = fix_info
        
        # Save fixed data
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(original_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved fixed boundary to: {output_file}")
        return str(output_file)
    
    def generate_validation_report(self, validation_result: Dict) -> str:
        """Generate a detailed validation report."""
        result = validation_result
        
        report = []
        report.append("="*80)
        report.append("BOUNDARY VALIDATION REPORT")
        report.append("="*80)
        report.append(f"Source: {result.get('source', 'Unknown')}")
        report.append(f"Valid: {'✅ YES' if result['valid'] else '❌ NO'}")
        
        if not result['valid']:
            report.append(f"Validity Issue: {result.get('validity_reason', 'Unknown')}")
        
        if 'analysis' in result:
            analysis = result['analysis']
            report.append(f"\nGeometry Analysis:")
            report.append(f"  Type: {analysis['type']}")
            report.append(f"  Area: {analysis['area']:.6f}")
            report.append(f"  Bounds: {analysis['bounds']}")
            report.append(f"  Centroid: [{analysis['centroid'][0]:.6f}, {analysis['centroid'][1]:.6f}]")
            report.append(f"  Coordinate Count: {analysis['coordinate_count']:,}")
            report.append(f"  Polygon Count: {analysis['polygon_count']}")
            if 'hole_count' in analysis:
                report.append(f"  Hole Count: {analysis['hole_count']}")
            report.append(f"  Is Simple: {'✅' if analysis['is_simple'] else '❌'}")
        
        if result['issues']:
            report.append(f"\nIssues Found ({len(result['issues'])}):")
            for i, issue in enumerate(result['issues'], 1):
                report.append(f"  {i:2d}. {issue}")
        else:
            report.append(f"\n✅ No issues found!")
        
        report.append("="*80)
        
        return "\n".join(report)


def main():
    """Main function to run boundary validation."""
    parser = argparse.ArgumentParser(description='Validate and fix city boundary GeoJSON files')
    parser.add_argument('files', nargs='+', help='GeoJSON files to validate')
    parser.add_argument('--fix', action='store_true', help='Attempt to fix invalid geometries')
    parser.add_argument('--output-dir', help='Directory to save fixed files (default: same as input)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if not SHAPELY_AVAILABLE:
        logger.error("Shapely is required for boundary validation.")
        logger.error("Install with: pip install shapely")
        sys.exit(1)
    
    validator = BoundaryValidator()
    
    for filepath in args.files:
        if not os.path.exists(filepath):
            logger.error(f"File not found: {filepath}")
            continue
        
        logger.info(f"\nProcessing: {filepath}")
        
        # Validate
        result = validator.validate_geojson_file(filepath)
        
        # Print report
        report = validator.generate_validation_report(result)
        print(report)
        
        # Fix if requested and needed
        if args.fix and not result['valid']:
            logger.info("Attempting to fix geometry...")
            fix_result = validator.fix_geometry(result)
            
            if fix_result:
                output_file = validator.save_fixed_boundary(filepath, fix_result['geometry'], fix_result)
                logger.info(f"✅ Fixed geometry saved to: {output_file}")
                logger.info(f"Fix method: {fix_result['method']}")
                logger.info(f"Area change: {fix_result['area_change']:.6f}")
                logger.info(f"Bounds change: {fix_result['bounds_change']:.6f}")
                
                # Validate the fixed version
                logger.info("Validating fixed geometry...")
                fixed_result = validator.validate_geojson_file(output_file)
                if fixed_result['valid']:
                    logger.info("✅ Fixed geometry is now valid!")
                else:
                    logger.warning("⚠️ Fixed geometry still has issues:")
                    logger.warning(fixed_result['validity_reason'])
            else:
                logger.error("❌ Could not fix geometry")


if __name__ == '__main__':
    main() 