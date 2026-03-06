import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text as RNText, View } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { PlantSpriteSvg } from './sprites/PlantSprites';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_W = Math.max(SCREEN_WIDTH, 900);
const CANVAS_H = 800;
const TILE_W = 120;
const TILE_H = 60;
const Z_SCALE = 1.4;
const CELL_SIZE = 52; // pixel size of each grid cell on screen

function gridToScreen(col: number, row: number, ox: number, oy: number) {
  return { x: ox + (col - row) * TILE_W, y: oy + (col + row) * TILE_H };
}

function diamondPath(cx: number, cy: number, w: number, h: number) {
  return `M ${cx} ${cy - h} L ${cx + w} ${cy} L ${cx} ${cy + h} L ${cx - w} ${cy} Z`;
}

interface Plant {
  id: string;
  custom_name: string;
  health_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  grid_col: number;
  grid_row: number;
  icon_emoji?: string;
  species_name?: string;
}

interface Zone {
  id: string;
  name: string;
  zone_type: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  grid_cols: number;
  grid_rows: number;
  plants: Plant[];
}

interface IsometricCanvasProps {
  zones: Zone[];
  isEditMode?: boolean;
  onPlantTap?: (plantId: string) => void;
  onZoneTap?: (zoneId: string) => void;
  onPlantMoved?: (plantId: string, gridCol: number, gridRow: number) => void;
  onZoneGridResize?: (zoneId: string, cols: number, rows: number) => void;
  onZoneMoved?: (zoneId: string, posX: number, posY: number) => void;
}

const ZONE_COLORS: Record<string, { fill: string; stroke: string }> = {
  raised_bed: { fill: '#D4956B40', stroke: '#D4956B80' },
  in_ground:  { fill: '#A8C68630', stroke: '#A8C68660' },
  container:  { fill: '#EDE6DA90', stroke: '#C8BFA8' },
  windowsill: { fill: '#FAF7F2E0', stroke: '#D4C9B8' },
  indoor:     { fill: '#F5F0E8C0', stroke: '#D4C9B8' },
};

const STATUS_COLORS: Record<string, string> = {
  healthy: colors.sprout,
  warning: colors.sunlight,
  critical: colors.terracotta,
  unknown: colors.sky,
};

function getZoneGeometry(zone: Zone, ox: number, oy: number) {
  const { x: zx, y: zy } = gridToScreen(zone.position_x * Z_SCALE, zone.position_y * Z_SCALE, ox, oy);
  const zw = zone.width * TILE_W * 2.5;
  const zh = zone.height * TILE_H * 2.5;
  return { zx, zy, zw, zh,
    top: { x: zx, y: zy - zh }, right: { x: zx + zw, y: zy },
    bottom: { x: zx, y: zy + zh }, left: { x: zx - zw, y: zy },
  };
}

/**
 * Get pixel position of a grid cell center within a zone's diamond.
 * Uses bilinear interpolation across the diamond shape.
 */
function cellCenter(col: number, row: number, gridCols: number, gridRows: number,
  top: {x:number,y:number}, right: {x:number,y:number}, bottom: {x:number,y:number}, left: {x:number,y:number}) {
  // Normalize to 0-1 with padding so cells don't sit on edges
  const t = (col + 0.5) / gridCols;
  const s = (row + 0.5) / gridRows;
  return {
    x: top.x*(1-t)*(1-s) + right.x*t*(1-s) + bottom.x*t*s + left.x*(1-t)*s,
    y: top.y*(1-t)*(1-s) + right.y*t*(1-s) + bottom.y*t*s + left.y*(1-t)*s,
  };
}

export function IsometricCanvas({
  zones, isEditMode = false, onPlantTap, onZoneTap, onPlantMoved, onZoneGridResize, onZoneMoved,
}: IsometricCanvasProps) {
  // Selected plant in edit mode (for click-to-move)
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Clear selection when exiting edit mode
  useEffect(() => { if (!isEditMode) { setSelectedPlantId(null); setSelectedZoneId(null); } }, [isEditMode]);

  // Canvas pan/zoom
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart(() => { savedScale.value = scale.value; })
    .onUpdate((e) => { scale.value = Math.max(0.3, Math.min(3, savedScale.value * e.scale)); });
  const pan = Gesture.Pan()
    .onStart(() => { savedTX.value = translateX.value; savedTY.value = translateY.value; })
    .onUpdate((e) => { translateX.value = savedTX.value + e.translationX; translateY.value = savedTY.value + e.translationY; });
  const composed = Gesture.Simultaneous(pinch, pan);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  const originX = CANVAS_W / 2;
  const originY = 120;

  // Handle clicking a grid cell in edit mode
  const handleCellPress = useCallback((zoneId: string, col: number, row: number, occupantId: string | null) => {
    if (!isEditMode) return;

    if (selectedPlantId && selectedZoneId) {
      // A plant is selected — move it to this cell
      if (!occupantId) {
        // Empty cell: move plant here
        onPlantMoved?.(selectedPlantId, col, row);
        setSelectedPlantId(null);
        setSelectedZoneId(null);
      } else if (occupantId === selectedPlantId) {
        // Clicked same plant: deselect
        setSelectedPlantId(null);
        setSelectedZoneId(null);
      } else {
        // Occupied cell: swap (move selected to this cell, move occupant to selected's old cell)
        const selectedZone = zones.find(z => z.id === selectedZoneId);
        const selectedPlant = selectedZone?.plants.find(p => p.id === selectedPlantId);
        if (selectedPlant) {
          onPlantMoved?.(selectedPlantId, col, row);
          onPlantMoved?.(occupantId, selectedPlant.grid_col, selectedPlant.grid_row);
        }
        setSelectedPlantId(null);
        setSelectedZoneId(null);
      }
    } else if (occupantId) {
      // No plant selected yet — select this one
      setSelectedPlantId(occupantId);
      setSelectedZoneId(zoneId);
    }
  }, [isEditMode, selectedPlantId, selectedZoneId, zones, onPlantMoved]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.canvasWrapper, animatedStyle]}>
          <Svg width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
            {/* Ground grid */}
            {Array.from({ length: 8 }, (_, r) =>
              Array.from({ length: 8 }, (_, c) => {
                const { x, y } = gridToScreen(c * 0.5, r * 0.5, originX, originY);
                return <Path key={`t-${r}-${c}`} d={diamondPath(x, y, TILE_W * 0.48, TILE_H * 0.48)} fill="none" stroke={colors.parchment} strokeWidth={0.8} opacity={0.4} />;
              })
            )}

            {/* Zones */}
            {zones.map((zone) => {
              const geo = getZoneGeometry(zone, originX, originY);
              const { zx, zy, top, right, bottom, left } = geo;
              const depth = 8;
              const zs = ZONE_COLORS[zone.zone_type ?? 'in_ground'] ?? ZONE_COLORS.in_ground;

              // Build plant lookup by grid cell
              const plantAt: Record<string, Plant> = {};
              zone.plants.forEach(p => { plantAt[`${p.grid_col},${p.grid_row}`] = p; });

              return (
                <G key={zone.id}>
                  {/* 3D sides */}
                  <Polygon points={`${left.x},${left.y} ${bottom.x},${bottom.y} ${bottom.x},${bottom.y+depth} ${left.x},${left.y+depth}`} fill={zs.stroke} opacity={0.5} />
                  <Polygon points={`${bottom.x},${bottom.y} ${right.x},${right.y} ${right.x},${right.y+depth} ${bottom.x},${bottom.y+depth}`} fill={zs.stroke} opacity={0.3} />

                  {/* Top face */}
                  <Path d={`M ${top.x} ${top.y} L ${right.x} ${right.y} L ${bottom.x} ${bottom.y} L ${left.x} ${left.y} Z`}
                    fill={zs.fill} stroke={zs.stroke} strokeWidth={1.5} />

                  {/* Grid cells */}
                  {Array.from({ length: zone.grid_rows }, (_, row) =>
                    Array.from({ length: zone.grid_cols }, (_, col) => {
                      const { x: cx, y: cy } = cellCenter(col, row, zone.grid_cols, zone.grid_rows, top, right, bottom, left);
                      const plant = plantAt[`${col},${row}`];
                      const isSelected = plant && plant.id === selectedPlantId;
                      const sc = plant ? (STATUS_COLORS[plant.health_status] ?? STATUS_COLORS.unknown) : 'transparent';

                      return (
                        <G key={`cell-${zone.id}-${col}-${row}`}
                          onPress={() => {
                            if (isEditMode) {
                              handleCellPress(zone.id, col, row, plant?.id ?? null);
                            } else if (plant) {
                              onPlantTap?.(plant.id);
                            }
                          }}
                        >
                          {/* Cell background — visible in edit mode */}
                          {isEditMode && (
                            <Circle cx={cx} cy={cy} r={CELL_SIZE / 2}
                              fill={isSelected ? colors.sage + '30' : (selectedPlantId && !plant ? colors.cream + '80' : 'transparent')}
                              stroke={isSelected ? colors.sage : (selectedPlantId && !plant ? colors.sage + '50' : zs.stroke + '40')}
                              strokeWidth={isSelected ? 2.5 : 1}
                              strokeDasharray={!plant && selectedPlantId ? '4,3' : undefined}
                            />
                          )}

                          {/* Plant sprite */}
                          {plant && (
                            <>
                              <Rect x={cx-12} y={cy+16} width={24} height={5} rx={2.5} fill={colors.bark} opacity={0.08} />
                              <PlantSpriteSvg species={plant.species_name ?? plant.custom_name} size={40} cx={cx} cy={cy} />
                              <Circle cx={cx+16} cy={cy-16} r={5} fill={sc} />
                              <Circle cx={cx+16} cy={cy-16} r={5} fill="none" stroke={colors.cream} strokeWidth={1.5} />
                              <SvgText x={cx} y={cy+32} textAnchor="middle" fontSize={9} fontWeight="600"
                                fontFamily="DMSans_500Medium, sans-serif" fill={colors.bark}>
                                {plant.custom_name.length > 12 ? plant.custom_name.slice(0, 11) + '…' : plant.custom_name}
                              </SvgText>
                            </>
                          )}
                        </G>
                      );
                    })
                  )}

                  {/* Zone label */}
                  <SvgText x={zx} y={bottom.y + depth + 20} textAnchor="middle" fontSize={13}
                    fontFamily="Caveat_400Regular, cursive" fill={colors.moss}>
                    {zone.name}
                  </SvgText>

                  {/* Edit mode: inline SVG toolbar */}
                  {isEditMode && (() => {
                    const ty = bottom.y + depth + 30; // just below zone name
                    const btnW = 18, btnH = 16, gap = 3;
                    const step = 0.12;
                    const btns = [
                      { label: '\u2190', action: () => onZoneMoved?.(zone.id, zone.position_x - step, zone.position_y + step) },
                      { label: '\u2191', action: () => onZoneMoved?.(zone.id, zone.position_x - step, zone.position_y - step) },
                      { label: '\u2193', action: () => onZoneMoved?.(zone.id, zone.position_x + step, zone.position_y + step) },
                      { label: '\u2192', action: () => onZoneMoved?.(zone.id, zone.position_x + step, zone.position_y - step) },
                    ];
                    const gridBtns = [
                      ...(zone.grid_cols > 1 ? [{ label: '-C', action: () => onZoneGridResize?.(zone.id, zone.grid_cols - 1, zone.grid_rows), add: false }] : []),
                      { label: '+C', action: () => onZoneGridResize?.(zone.id, zone.grid_cols + 1, zone.grid_rows), add: true },
                      ...(zone.grid_rows > 1 ? [{ label: '-R', action: () => onZoneGridResize?.(zone.id, zone.grid_cols, zone.grid_rows - 1), add: false }] : []),
                      { label: '+R', action: () => onZoneGridResize?.(zone.id, zone.grid_cols, zone.grid_rows + 1), add: true },
                    ];
                    const totalBtns = btns.length + gridBtns.length;
                    const totalW = totalBtns * (btnW + gap) - gap;
                    let bx = zx - totalW / 2;

                    return (
                      <G>
                        {btns.map((b, i) => {
                          const x = bx + i * (btnW + gap);
                          return (
                            <G key={`arr-${i}`} onPress={b.action}>
                              <Rect x={x} y={ty} width={btnW} height={btnH} rx={4} fill={colors.sage + '30'} />
                              <SvgText x={x + btnW/2} y={ty + btnH/2 + 4} textAnchor="middle" fontSize={10} fill={colors.forest}>{b.label}</SvgText>
                            </G>
                          );
                        })}
                        {gridBtns.map((b, i) => {
                          const x = bx + (btns.length + i) * (btnW + gap);
                          return (
                            <G key={`grid-${i}`} onPress={b.action}>
                              <Rect x={x} y={ty} width={btnW} height={btnH} rx={4} fill={b.add ? colors.sage + '70' : colors.parchment} />
                              <SvgText x={x + btnW/2} y={ty + btnH/2 + 3} textAnchor="middle" fontSize={7} fontWeight="700"
                                fill={b.add ? colors.cream : colors.bark}>{b.label}</SvgText>
                            </G>
                          );
                        })}
                      </G>
                    );
                  })()}
                </G>
              );
            })}
          </Svg>

          {/* (toolbars are now rendered as SVG inside zone groups above) */}
        </Animated.View>
      </GestureDetector>

      {/* Edit mode indicators */}
      {isEditMode && (
        <View style={styles.editBanner}>
          <RNText style={styles.editBannerText}>
            {selectedPlantId ? 'Tap an empty cell to move, or another plant to swap' : 'Tap a plant to select it'}
          </RNText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen, overflow: 'hidden' },
  canvasWrapper: { flex: 1 },
  editBanner: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: colors.sage + 'DD',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBannerText: {
    color: colors.cream,
    fontSize: 12,
    fontWeight: '600',
  },
});
