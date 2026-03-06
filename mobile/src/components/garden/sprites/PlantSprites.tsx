/**
 * Custom SVG plant illustrations for the isometric garden.
 * Each sprite is hand-crafted to match the Nurch design language:
 * warm earth tones, soft rounded shapes, organic feel.
 *
 * Usage: <PlantSprite species="tomato" size={40} />
 */
import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

interface PlantSpriteProps {
  species: string;
  size?: number;
}

// Color palette matching Nurch design system
const C = {
  stem: '#6B7F5E',        // moss
  leaf: '#8B9E7C',        // sage
  leafDark: '#4A5D3F',    // forest
  leafLight: '#A8C686',   // sprout
  pot: '#C67B5C',         // terracotta
  potDark: '#A66348',
  soil: '#5C4A3A',        // bark
  flower: '#D4A0A0',      // blush
  flowerYellow: '#E8C95A', // sunlight
  fruit: '#C44B3F',
  fruitGreen: '#7BA05B',
  water: '#9BB5C9',       // sky
  white: '#FAF7F2',       // cream
};

function Tomato({ s }: { s: number }) {
  return (
    <G>
      {/* Pot */}
      <Path d={`M ${s*0.3} ${s*0.75} L ${s*0.35} ${s*0.95} L ${s*0.65} ${s*0.95} L ${s*0.7} ${s*0.75} Z`} fill={C.pot} />
      <Rect x={s*0.28} y={s*0.72} width={s*0.44} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      {/* Main stem */}
      <Line x1={s*0.5} y1={s*0.72} x2={s*0.5} y2={s*0.3} stroke={C.stem} strokeWidth={s*0.04} strokeLinecap="round" />
      {/* Branches */}
      <Line x1={s*0.5} y1={s*0.5} x2={s*0.3} y2={s*0.35} stroke={C.stem} strokeWidth={s*0.03} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.45} x2={s*0.72} y2={s*0.32} stroke={C.stem} strokeWidth={s*0.03} strokeLinecap="round" />
      {/* Leaves */}
      <Ellipse cx={s*0.35} cy={s*0.38} rx={s*0.1} ry={s*0.06} fill={C.leaf} transform={`rotate(-30 ${s*0.35} ${s*0.38})`} />
      <Ellipse cx={s*0.65} cy={s*0.35} rx={s*0.1} ry={s*0.06} fill={C.leafDark} transform={`rotate(20 ${s*0.65} ${s*0.35})`} />
      <Ellipse cx={s*0.5} cy={s*0.28} rx={s*0.08} ry={s*0.05} fill={C.leafLight} />
      {/* Tomatoes */}
      <Circle cx={s*0.38} cy={s*0.55} r={s*0.07} fill={C.fruit} />
      <Circle cx={s*0.62} cy={s*0.5} r={s*0.06} fill={C.fruit} />
      <Circle cx={s*0.52} cy={s*0.6} r={s*0.05} fill="#E07060" />
    </G>
  );
}

function Basil({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.3} ${s*0.78} L ${s*0.35} ${s*0.95} L ${s*0.65} ${s*0.95} L ${s*0.7} ${s*0.78} Z`} fill={C.pot} />
      <Rect x={s*0.28} y={s*0.75} width={s*0.44} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      <Line x1={s*0.5} y1={s*0.75} x2={s*0.5} y2={s*0.35} stroke={C.stem} strokeWidth={s*0.04} strokeLinecap="round" />
      {/* Rounded basil leaves */}
      <Ellipse cx={s*0.38} cy={s*0.45} rx={s*0.12} ry={s*0.08} fill={C.leaf} transform={`rotate(-15 ${s*0.38} ${s*0.45})`} />
      <Ellipse cx={s*0.62} cy={s*0.42} rx={s*0.12} ry={s*0.08} fill={C.leafDark} transform={`rotate(15 ${s*0.62} ${s*0.42})`} />
      <Ellipse cx={s*0.45} cy={s*0.3} rx={s*0.1} ry={s*0.07} fill={C.leafLight} transform={`rotate(-10 ${s*0.45} ${s*0.3})`} />
      <Ellipse cx={s*0.58} cy={s*0.28} rx={s*0.1} ry={s*0.07} fill={C.leaf} transform={`rotate(10 ${s*0.58} ${s*0.28})`} />
      <Ellipse cx={s*0.5} cy={s*0.2} rx={s*0.08} ry={s*0.06} fill={C.leafLight} />
      <Ellipse cx={s*0.35} cy={s*0.58} rx={s*0.1} ry={s*0.07} fill={C.leafDark} transform={`rotate(-20 ${s*0.35} ${s*0.58})`} />
      <Ellipse cx={s*0.65} cy={s*0.55} rx={s*0.1} ry={s*0.07} fill={C.leaf} transform={`rotate(20 ${s*0.65} ${s*0.55})`} />
    </G>
  );
}

function Rose({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.32} ${s*0.78} L ${s*0.36} ${s*0.95} L ${s*0.64} ${s*0.95} L ${s*0.68} ${s*0.78} Z`} fill={C.pot} />
      <Rect x={s*0.3} y={s*0.75} width={s*0.4} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      <Line x1={s*0.5} y1={s*0.75} x2={s*0.5} y2={s*0.28} stroke={C.stem} strokeWidth={s*0.03} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.55} x2={s*0.35} y2={s*0.45} stroke={C.stem} strokeWidth={s*0.025} strokeLinecap="round" />
      {/* Leaves */}
      <Ellipse cx={s*0.38} cy={s*0.6} rx={s*0.08} ry={s*0.05} fill={C.leafDark} transform={`rotate(-30 ${s*0.38} ${s*0.6})`} />
      <Ellipse cx={s*0.6} cy={s*0.55} rx={s*0.08} ry={s*0.05} fill={C.leaf} transform={`rotate(25 ${s*0.6} ${s*0.55})`} />
      {/* Rose bloom */}
      <Circle cx={s*0.5} cy={s*0.25} r={s*0.1} fill={C.flower} />
      <Circle cx={s*0.5} cy={s*0.25} r={s*0.065} fill="#C48888" />
      <Circle cx={s*0.5} cy={s*0.25} r={s*0.035} fill="#B07070" />
      {/* Second bloom */}
      <Circle cx={s*0.33} cy={s*0.4} r={s*0.07} fill={C.flower} />
      <Circle cx={s*0.33} cy={s*0.4} r={s*0.04} fill="#C48888" />
    </G>
  );
}

function Sunflower({ s }: { s: number }) {
  return (
    <G>
      <Ellipse cx={s*0.5} cy={s*0.93} rx={s*0.15} ry={s*0.04} fill={C.soil} opacity={0.3} />
      <Line x1={s*0.5} y1={s*0.9} x2={s*0.5} y2={s*0.3} stroke={C.stem} strokeWidth={s*0.05} strokeLinecap="round" />
      <Ellipse cx={s*0.35} cy={s*0.6} rx={s*0.12} ry={s*0.06} fill={C.leaf} transform={`rotate(-40 ${s*0.35} ${s*0.6})`} />
      <Ellipse cx={s*0.65} cy={s*0.5} rx={s*0.12} ry={s*0.06} fill={C.leafDark} transform={`rotate(35 ${s*0.65} ${s*0.5})`} />
      {/* Petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <Ellipse key={angle} cx={s*0.5} cy={s*0.18} rx={s*0.04} ry={s*0.1} fill={C.flowerYellow} transform={`rotate(${angle} ${s*0.5} ${s*0.25})`} />
      ))}
      {/* Center */}
      <Circle cx={s*0.5} cy={s*0.25} r={s*0.08} fill={C.soil} />
      <Circle cx={s*0.5} cy={s*0.25} r={s*0.055} fill="#6B5040" />
    </G>
  );
}

function SnakePlant({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.3} ${s*0.75} L ${s*0.33} ${s*0.95} L ${s*0.67} ${s*0.95} L ${s*0.7} ${s*0.75} Z`} fill={C.pot} />
      <Rect x={s*0.28} y={s*0.72} width={s*0.44} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      {/* Tall upright leaves */}
      <Path d={`M ${s*0.45} ${s*0.72} Q ${s*0.42} ${s*0.4} ${s*0.4} ${s*0.12}`} stroke={C.leafDark} strokeWidth={s*0.06} fill="none" strokeLinecap="round" />
      <Path d={`M ${s*0.52} ${s*0.72} Q ${s*0.52} ${s*0.35} ${s*0.5} ${s*0.08}`} stroke={C.leaf} strokeWidth={s*0.06} fill="none" strokeLinecap="round" />
      <Path d={`M ${s*0.58} ${s*0.72} Q ${s*0.6} ${s*0.4} ${s*0.62} ${s*0.15}`} stroke={C.leafLight} strokeWidth={s*0.06} fill="none" strokeLinecap="round" />
      {/* Stripe accents */}
      <Line x1={s*0.4} y1={s*0.35} x2={s*0.42} y2={s*0.3} stroke={C.flowerYellow} strokeWidth={s*0.015} opacity={0.5} />
      <Line x1={s*0.5} y1={s*0.3} x2={s*0.5} y2={s*0.25} stroke={C.flowerYellow} strokeWidth={s*0.015} opacity={0.5} />
      <Line x1={s*0.61} y1={s*0.35} x2={s*0.62} y2={s*0.3} stroke={C.flowerYellow} strokeWidth={s*0.015} opacity={0.5} />
    </G>
  );
}

function Monstera({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.3} ${s*0.78} L ${s*0.34} ${s*0.95} L ${s*0.66} ${s*0.95} L ${s*0.7} ${s*0.78} Z`} fill={C.pot} />
      <Rect x={s*0.28} y={s*0.75} width={s*0.44} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      <Line x1={s*0.5} y1={s*0.75} x2={s*0.5} y2={s*0.45} stroke={C.stem} strokeWidth={s*0.04} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.6} x2={s*0.3} y2={s*0.35} stroke={C.stem} strokeWidth={s*0.03} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.55} x2={s*0.72} y2={s*0.3} stroke={C.stem} strokeWidth={s*0.03} strokeLinecap="round" />
      {/* Big monstera leaves with holes */}
      <Ellipse cx={s*0.3} cy={s*0.3} rx={s*0.17} ry={s*0.14} fill={C.leafDark} transform={`rotate(-15 ${s*0.3} ${s*0.3})`} />
      <Ellipse cx={s*0.3} cy={s*0.28} rx={s*0.04} ry={s*0.03} fill={C.white} />
      <Ellipse cx={s*0.72} cy={s*0.25} rx={s*0.16} ry={s*0.13} fill={C.leaf} transform={`rotate(10 ${s*0.72} ${s*0.25})`} />
      <Ellipse cx={s*0.73} cy={s*0.23} rx={s*0.035} ry={s*0.025} fill={C.white} />
      <Ellipse cx={s*0.5} cy={s*0.38} rx={s*0.14} ry={s*0.1} fill={C.leafLight} />
    </G>
  );
}

function Strawberry({ s }: { s: number }) {
  return (
    <G>
      <Ellipse cx={s*0.5} cy={s*0.93} rx={s*0.2} ry={s*0.04} fill={C.soil} opacity={0.3} />
      <Line x1={s*0.5} y1={s*0.9} x2={s*0.5} y2={s*0.5} stroke={C.stem} strokeWidth={s*0.03} strokeLinecap="round" />
      {/* Leaves */}
      <Ellipse cx={s*0.38} cy={s*0.45} rx={s*0.12} ry={s*0.07} fill={C.leaf} transform={`rotate(-20 ${s*0.38} ${s*0.45})`} />
      <Ellipse cx={s*0.62} cy={s*0.42} rx={s*0.12} ry={s*0.07} fill={C.leafDark} transform={`rotate(20 ${s*0.62} ${s*0.42})`} />
      <Ellipse cx={s*0.5} cy={s*0.35} rx={s*0.1} ry={s*0.06} fill={C.leafLight} />
      {/* Strawberry fruits */}
      <Path d={`M ${s*0.4} ${s*0.6} Q ${s*0.35} ${s*0.7} ${s*0.4} ${s*0.78} Q ${s*0.45} ${s*0.82} ${s*0.4} ${s*0.6}`} fill={C.fruit} />
      <Path d={`M ${s*0.6} ${s*0.55} Q ${s*0.55} ${s*0.65} ${s*0.6} ${s*0.72} Q ${s*0.65} ${s*0.75} ${s*0.6} ${s*0.55}`} fill={C.fruit} />
      {/* Seeds */}
      <Circle cx={s*0.39} cy={s*0.68} r={s*0.01} fill={C.flowerYellow} />
      <Circle cx={s*0.41} cy={s*0.73} r={s*0.01} fill={C.flowerYellow} />
      <Circle cx={s*0.59} cy={s*0.63} r={s*0.01} fill={C.flowerYellow} />
    </G>
  );
}

function Cucumber({ s }: { s: number }) {
  return (
    <G>
      <Ellipse cx={s*0.5} cy={s*0.93} rx={s*0.2} ry={s*0.04} fill={C.soil} opacity={0.3} />
      <Line x1={s*0.5} y1={s*0.9} x2={s*0.5} y2={s*0.4} stroke={C.stem} strokeWidth={s*0.04} strokeLinecap="round" />
      <Ellipse cx={s*0.35} cy={s*0.45} rx={s*0.13} ry={s*0.08} fill={C.leaf} transform={`rotate(-25 ${s*0.35} ${s*0.45})`} />
      <Ellipse cx={s*0.65} cy={s*0.4} rx={s*0.13} ry={s*0.08} fill={C.leafDark} transform={`rotate(25 ${s*0.65} ${s*0.4})`} />
      {/* Cucumbers */}
      <Rect x={s*0.32} y={s*0.6} width={s*0.12} height={s*0.22} rx={s*0.06} fill="#5C8A3E" transform={`rotate(-10 ${s*0.38} ${s*0.71})`} />
      <Rect x={s*0.56} y={s*0.55} width={s*0.1} height={s*0.18} rx={s*0.05} fill="#6B9E4A" transform={`rotate(8 ${s*0.61} ${s*0.64})`} />
      {/* Small flower */}
      <Circle cx={s*0.5} cy={s*0.35} r={s*0.04} fill={C.flowerYellow} />
    </G>
  );
}

function Pepper({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.3} ${s*0.78} L ${s*0.34} ${s*0.95} L ${s*0.66} ${s*0.95} L ${s*0.7} ${s*0.78} Z`} fill={C.pot} />
      <Rect x={s*0.28} y={s*0.75} width={s*0.44} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      <Line x1={s*0.5} y1={s*0.75} x2={s*0.5} y2={s*0.35} stroke={C.stem} strokeWidth={s*0.04} strokeLinecap="round" />
      <Ellipse cx={s*0.38} cy={s*0.4} rx={s*0.1} ry={s*0.06} fill={C.leaf} transform={`rotate(-20 ${s*0.38} ${s*0.4})`} />
      <Ellipse cx={s*0.62} cy={s*0.38} rx={s*0.1} ry={s*0.06} fill={C.leafDark} transform={`rotate(20 ${s*0.62} ${s*0.38})`} />
      {/* Bell peppers */}
      <Rect x={s*0.34} y={s*0.52} width={s*0.12} height={s*0.16} rx={s*0.06} fill="#4CAF50" />
      <Rect x={s*0.55} y={s*0.48} width={s*0.11} height={s*0.15} rx={s*0.055} fill="#FF8F00" />
      <Line x1={s*0.4} y1={s*0.52} x2={s*0.4} y2={s*0.48} stroke={C.stem} strokeWidth={s*0.02} strokeLinecap="round" />
      <Line x1={s*0.6} y1={s*0.48} x2={s*0.6} y2={s*0.44} stroke={C.stem} strokeWidth={s*0.02} strokeLinecap="round" />
    </G>
  );
}

function Pothos({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.32} ${s*0.35} L ${s*0.35} ${s*0.5} L ${s*0.65} ${s*0.5} L ${s*0.68} ${s*0.35} Z`} fill={C.pot} />
      <Rect x={s*0.3} y={s*0.32} width={s*0.4} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      {/* Trailing vines */}
      <Path d={`M ${s*0.4} ${s*0.5} Q ${s*0.25} ${s*0.6} ${s*0.2} ${s*0.75} Q ${s*0.18} ${s*0.85} ${s*0.25} ${s*0.92}`} stroke={C.stem} strokeWidth={s*0.025} fill="none" strokeLinecap="round" />
      <Path d={`M ${s*0.6} ${s*0.5} Q ${s*0.75} ${s*0.65} ${s*0.78} ${s*0.8} Q ${s*0.8} ${s*0.88} ${s*0.72} ${s*0.95}`} stroke={C.stem} strokeWidth={s*0.025} fill="none" strokeLinecap="round" />
      {/* Heart-shaped leaves along vines */}
      <Ellipse cx={s*0.25} cy={s*0.62} rx={s*0.07} ry={s*0.05} fill={C.leaf} transform={`rotate(-30 ${s*0.25} ${s*0.62})`} />
      <Ellipse cx={s*0.2} cy={s*0.78} rx={s*0.08} ry={s*0.055} fill={C.leafLight} transform={`rotate(-15 ${s*0.2} ${s*0.78})`} />
      <Ellipse cx={s*0.72} cy={s*0.68} rx={s*0.07} ry={s*0.05} fill={C.leafDark} transform={`rotate(25 ${s*0.72} ${s*0.68})`} />
      <Ellipse cx={s*0.77} cy={s*0.83} rx={s*0.08} ry={s*0.055} fill={C.leaf} transform={`rotate(10 ${s*0.77} ${s*0.83})`} />
      {/* Top leaves */}
      <Ellipse cx={s*0.45} cy={s*0.28} rx={s*0.09} ry={s*0.06} fill={C.leaf} transform={`rotate(-10 ${s*0.45} ${s*0.28})`} />
      <Ellipse cx={s*0.58} cy={s*0.25} rx={s*0.09} ry={s*0.06} fill={C.leafDark} transform={`rotate(15 ${s*0.58} ${s*0.25})`} />
    </G>
  );
}

function GenericHerb({ s }: { s: number }) {
  // Used for mint, cilantro, rosemary, thyme
  return (
    <G>
      <Path d={`M ${s*0.32} ${s*0.78} L ${s*0.36} ${s*0.95} L ${s*0.64} ${s*0.95} L ${s*0.68} ${s*0.78} Z`} fill={C.pot} />
      <Rect x={s*0.3} y={s*0.75} width={s*0.4} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      <Line x1={s*0.5} y1={s*0.75} x2={s*0.5} y2={s*0.35} stroke={C.stem} strokeWidth={s*0.03} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.6} x2={s*0.35} y2={s*0.5} stroke={C.stem} strokeWidth={s*0.025} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.55} x2={s*0.68} y2={s*0.45} stroke={C.stem} strokeWidth={s*0.025} strokeLinecap="round" />
      <Ellipse cx={s*0.35} cy={s*0.48} rx={s*0.08} ry={s*0.04} fill={C.leaf} transform={`rotate(-25 ${s*0.35} ${s*0.48})`} />
      <Ellipse cx={s*0.65} cy={s*0.43} rx={s*0.08} ry={s*0.04} fill={C.leafDark} transform={`rotate(20 ${s*0.65} ${s*0.43})`} />
      <Ellipse cx={s*0.45} cy={s*0.33} rx={s*0.07} ry={s*0.04} fill={C.leafLight} transform={`rotate(-10 ${s*0.45} ${s*0.33})`} />
      <Ellipse cx={s*0.58} cy={s*0.3} rx={s*0.07} ry={s*0.04} fill={C.leaf} transform={`rotate(10 ${s*0.58} ${s*0.3})`} />
      <Ellipse cx={s*0.5} cy={s*0.25} rx={s*0.06} ry={s*0.035} fill={C.leafLight} />
    </G>
  );
}

function Lavender({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.32} ${s*0.78} L ${s*0.36} ${s*0.95} L ${s*0.64} ${s*0.95} L ${s*0.68} ${s*0.78} Z`} fill={C.pot} />
      <Rect x={s*0.3} y={s*0.75} width={s*0.4} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      {/* Stems */}
      <Line x1={s*0.4} y1={s*0.75} x2={s*0.35} y2={s*0.2} stroke={C.stem} strokeWidth={s*0.02} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.75} x2={s*0.5} y2={s*0.15} stroke={C.stem} strokeWidth={s*0.02} strokeLinecap="round" />
      <Line x1={s*0.6} y1={s*0.75} x2={s*0.65} y2={s*0.22} stroke={C.stem} strokeWidth={s*0.02} strokeLinecap="round" />
      {/* Flower spikes */}
      {[0.15, 0.2, 0.25, 0.3].map((y, i) => (
        <Ellipse key={`l-${i}`} cx={s*0.35} cy={s*y} rx={s*0.035} ry={s*0.025} fill="#9B7CB8" />
      ))}
      {[0.1, 0.15, 0.2, 0.25, 0.3].map((y, i) => (
        <Ellipse key={`m-${i}`} cx={s*0.5} cy={s*y} rx={s*0.035} ry={s*0.025} fill="#8B6CA8" />
      ))}
      {[0.18, 0.23, 0.28, 0.33].map((y, i) => (
        <Ellipse key={`r-${i}`} cx={s*0.65} cy={s*y} rx={s*0.035} ry={s*0.025} fill="#A88CC0" />
      ))}
      {/* Small leaves */}
      <Ellipse cx={s*0.42} cy={s*0.6} rx={s*0.06} ry={s*0.025} fill={C.leaf} transform={`rotate(-30 ${s*0.42} ${s*0.6})`} />
      <Ellipse cx={s*0.58} cy={s*0.58} rx={s*0.06} ry={s*0.025} fill={C.leaf} transform={`rotate(30 ${s*0.58} ${s*0.58})`} />
    </G>
  );
}

function Marigold({ s }: { s: number }) {
  return (
    <G>
      <Ellipse cx={s*0.5} cy={s*0.93} rx={s*0.15} ry={s*0.04} fill={C.soil} opacity={0.3} />
      <Line x1={s*0.5} y1={s*0.9} x2={s*0.5} y2={s*0.4} stroke={C.stem} strokeWidth={s*0.035} strokeLinecap="round" />
      <Ellipse cx={s*0.38} cy={s*0.55} rx={s*0.1} ry={s*0.06} fill={C.leafDark} transform={`rotate(-25 ${s*0.38} ${s*0.55})`} />
      <Ellipse cx={s*0.62} cy={s*0.52} rx={s*0.1} ry={s*0.06} fill={C.leaf} transform={`rotate(25 ${s*0.62} ${s*0.52})`} />
      {/* Marigold bloom — layered petals */}
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => (
        <Ellipse key={angle} cx={s*0.5} cy={s*0.27} rx={s*0.035} ry={s*0.08} fill="#FF9800" transform={`rotate(${angle} ${s*0.5} ${s*0.33})`} />
      ))}
      <Circle cx={s*0.5} cy={s*0.33} r={s*0.06} fill="#FFB74D" />
      <Circle cx={s*0.5} cy={s*0.33} r={s*0.035} fill="#F57C00" />
    </G>
  );
}

function Lettuce({ s }: { s: number }) {
  return (
    <G>
      <Ellipse cx={s*0.5} cy={s*0.93} rx={s*0.2} ry={s*0.04} fill={C.soil} opacity={0.3} />
      {/* Lettuce head — overlapping ruffled leaves */}
      <Ellipse cx={s*0.5} cy={s*0.7} rx={s*0.22} ry={s*0.12} fill={C.leafLight} />
      <Ellipse cx={s*0.4} cy={s*0.6} rx={s*0.18} ry={s*0.1} fill={C.leaf} transform={`rotate(-10 ${s*0.4} ${s*0.6})`} />
      <Ellipse cx={s*0.6} cy={s*0.58} rx={s*0.18} ry={s*0.1} fill="#9AB87C" transform={`rotate(10 ${s*0.6} ${s*0.58})`} />
      <Ellipse cx={s*0.5} cy={s*0.5} rx={s*0.16} ry={s*0.09} fill={C.leafLight} />
      <Ellipse cx={s*0.45} cy={s*0.43} rx={s*0.12} ry={s*0.07} fill={C.leaf} transform={`rotate(-5 ${s*0.45} ${s*0.43})`} />
      <Ellipse cx={s*0.55} cy={s*0.4} rx={s*0.1} ry={s*0.06} fill="#B4D89E" />
    </G>
  );
}

function AloeVera({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.3} ${s*0.72} L ${s*0.34} ${s*0.95} L ${s*0.66} ${s*0.95} L ${s*0.7} ${s*0.72} Z`} fill={C.pot} />
      <Rect x={s*0.28} y={s*0.69} width={s*0.44} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      {/* Thick pointed aloe leaves */}
      <Path d={`M ${s*0.5} ${s*0.7} Q ${s*0.3} ${s*0.5} ${s*0.25} ${s*0.2}`} stroke="#7BAF5C" strokeWidth={s*0.07} fill="none" strokeLinecap="round" />
      <Path d={`M ${s*0.5} ${s*0.7} Q ${s*0.5} ${s*0.4} ${s*0.5} ${s*0.12}`} stroke="#8DC46A" strokeWidth={s*0.07} fill="none" strokeLinecap="round" />
      <Path d={`M ${s*0.5} ${s*0.7} Q ${s*0.7} ${s*0.5} ${s*0.75} ${s*0.2}`} stroke="#6BA04E" strokeWidth={s*0.07} fill="none" strokeLinecap="round" />
      {/* Lighter center stripes */}
      <Path d={`M ${s*0.5} ${s*0.65} Q ${s*0.5} ${s*0.4} ${s*0.5} ${s*0.18}`} stroke="#A8D88A" strokeWidth={s*0.02} fill="none" strokeLinecap="round" opacity={0.5} />
    </G>
  );
}

function FiddleLeafFig({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.32} ${s*0.75} L ${s*0.36} ${s*0.95} L ${s*0.64} ${s*0.95} L ${s*0.68} ${s*0.75} Z`} fill={C.pot} />
      <Rect x={s*0.3} y={s*0.72} width={s*0.4} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      {/* Trunk */}
      <Line x1={s*0.5} y1={s*0.72} x2={s*0.5} y2={s*0.4} stroke="#8B7355" strokeWidth={s*0.05} strokeLinecap="round" />
      {/* Large fiddle-shaped leaves */}
      <Ellipse cx={s*0.35} cy={s*0.35} rx={s*0.12} ry={s*0.15} fill={C.leafDark} transform={`rotate(-10 ${s*0.35} ${s*0.35})`} />
      <Ellipse cx={s*0.65} cy={s*0.3} rx={s*0.12} ry={s*0.15} fill={C.leaf} transform={`rotate(10 ${s*0.65} ${s*0.3})`} />
      <Ellipse cx={s*0.5} cy={s*0.2} rx={s*0.11} ry={s*0.14} fill={C.leafLight} />
      {/* Leaf veins */}
      <Line x1={s*0.35} y1={s*0.25} x2={s*0.35} y2={s*0.45} stroke={C.leafLight} strokeWidth={s*0.01} opacity={0.4} />
      <Line x1={s*0.65} y1={s*0.2} x2={s*0.65} y2={s*0.4} stroke={C.leafDark} strokeWidth={s*0.01} opacity={0.3} />
    </G>
  );
}

function SpiderPlant({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.32} ${s*0.42} L ${s*0.36} ${s*0.58} L ${s*0.64} ${s*0.58} L ${s*0.68} ${s*0.42} Z`} fill={C.pot} />
      <Rect x={s*0.3} y={s*0.39} width={s*0.4} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      {/* Arching leaves from center */}
      <Path d={`M ${s*0.5} ${s*0.4} Q ${s*0.2} ${s*0.2} ${s*0.12} ${s*0.4}`} stroke={C.leaf} strokeWidth={s*0.03} fill="none" strokeLinecap="round" />
      <Path d={`M ${s*0.5} ${s*0.4} Q ${s*0.8} ${s*0.2} ${s*0.88} ${s*0.4}`} stroke={C.leafDark} strokeWidth={s*0.03} fill="none" strokeLinecap="round" />
      <Path d={`M ${s*0.5} ${s*0.4} Q ${s*0.3} ${s*0.15} ${s*0.2} ${s*0.25}`} stroke={C.leafLight} strokeWidth={s*0.025} fill="none" strokeLinecap="round" />
      <Path d={`M ${s*0.5} ${s*0.4} Q ${s*0.7} ${s*0.15} ${s*0.8} ${s*0.25}`} stroke={C.leaf} strokeWidth={s*0.025} fill="none" strokeLinecap="round" />
      {/* Trailing runners with baby plants */}
      <Path d={`M ${s*0.5} ${s*0.55} Q ${s*0.25} ${s*0.7} ${s*0.15} ${s*0.85}`} stroke={C.stem} strokeWidth={s*0.015} fill="none" strokeLinecap="round" />
      <Path d={`M ${s*0.5} ${s*0.55} Q ${s*0.75} ${s*0.7} ${s*0.85} ${s*0.85}`} stroke={C.stem} strokeWidth={s*0.015} fill="none" strokeLinecap="round" />
      {/* Baby plantlets */}
      <Circle cx={s*0.15} cy={s*0.85} r={s*0.04} fill={C.leafLight} />
      <Circle cx={s*0.85} cy={s*0.85} r={s*0.04} fill={C.leafLight} />
      {/* Stripe accents */}
      <Path d={`M ${s*0.5} ${s*0.4} Q ${s*0.25} ${s*0.22} ${s*0.16} ${s*0.38}`} stroke={C.white} strokeWidth={s*0.008} fill="none" opacity={0.4} />
      <Path d={`M ${s*0.5} ${s*0.4} Q ${s*0.75} ${s*0.22} ${s*0.84} ${s*0.38}`} stroke={C.white} strokeWidth={s*0.008} fill="none" opacity={0.4} />
    </G>
  );
}

function DefaultPlant({ s }: { s: number }) {
  return (
    <G>
      <Path d={`M ${s*0.32} ${s*0.78} L ${s*0.36} ${s*0.95} L ${s*0.64} ${s*0.95} L ${s*0.68} ${s*0.78} Z`} fill={C.pot} />
      <Rect x={s*0.3} y={s*0.75} width={s*0.4} height={s*0.06} rx={s*0.02} fill={C.potDark} />
      <Line x1={s*0.5} y1={s*0.75} x2={s*0.5} y2={s*0.4} stroke={C.stem} strokeWidth={s*0.04} strokeLinecap="round" />
      <Ellipse cx={s*0.38} cy={s*0.42} rx={s*0.1} ry={s*0.06} fill={C.leaf} transform={`rotate(-20 ${s*0.38} ${s*0.42})`} />
      <Ellipse cx={s*0.62} cy={s*0.38} rx={s*0.1} ry={s*0.06} fill={C.leafDark} transform={`rotate(20 ${s*0.62} ${s*0.38})`} />
      <Ellipse cx={s*0.5} cy={s*0.3} rx={s*0.08} ry={s*0.05} fill={C.leafLight} />
    </G>
  );
}

// Species name → sprite mapping
const SPRITE_MAP: Record<string, React.FC<{ s: number }>> = {
  tomato: Tomato,
  basil: Basil,
  sweet_basil: Basil,
  rose: Rose,
  hybrid_tea_rose: Rose,
  sunflower: Sunflower,
  common_sunflower: Sunflower,
  snake_plant: SnakePlant,
  monstera: Monstera,
  monstera_deliciosa: Monstera,
  strawberry: Strawberry,
  garden_strawberry: Strawberry,
  cucumber: Cucumber,
  pepper: Pepper,
  bell_pepper: Pepper,
  pothos: Pothos,
  golden_pothos: Pothos,
  mint: GenericHerb,
  spearmint: GenericHerb,
  cilantro: GenericHerb,
  rosemary: GenericHerb,
  thyme: GenericHerb,
  common_thyme: GenericHerb,
  lavender: Lavender,
  english_lavender: Lavender,
  marigold: Marigold,
  french_marigold: Marigold,
  lettuce: Lettuce,
  butterhead_lettuce: Lettuce,
  aloe: AloeVera,
  aloe_vera: AloeVera,
  fiddle_leaf_fig: FiddleLeafFig,
  spider_plant: SpiderPlant,
};

function normalizeSpeciesKey(species: string): string {
  return species.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

export function PlantSprite({ species, size = 40 }: PlantSpriteProps) {
  const key = normalizeSpeciesKey(species);
  const SpriteComponent = SPRITE_MAP[key] ?? DefaultPlant;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <SpriteComponent s={size} />
    </Svg>
  );
}

export function PlantSpriteSvg({ species, size = 40, cx, cy }: PlantSpriteProps & { cx: number; cy: number }) {
  /**
   * Inline SVG version for use inside an existing <Svg> canvas (the isometric map).
   * Renders the sprite centered at (cx, cy).
   */
  const key = normalizeSpeciesKey(species);
  const SpriteComponent = SPRITE_MAP[key] ?? DefaultPlant;
  const half = size / 2;

  return (
    <G transform={`translate(${cx - half}, ${cy - half})`}>
      <SpriteComponent s={size} />
    </G>
  );
}
