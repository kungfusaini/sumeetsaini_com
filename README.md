# Sumeet Saini - 3D Pyramid Personal Website

Interactive 3D pyramid built with Three.js. Drag to rotate, click faces to explore content.

## 🎮 3D Implementation
- **Custom Tetrahedron**: Programmatic geometry with BufferGeometry
- **Quaternion Rotation**: Gimbal-lock-free smooth rotations
- **Composite Textures**: Canvas-based faces with grain overlays
- **High-Res Rendering**: 4096x4096 textures for crisp visuals

## ⚡ Performance
- **60fps Loop**: RequestAnimationFrame with GPU acceleration
- **Physics Simulation**: Momentum-based drag with velocity damping
- **Responsive Camera**: Dynamic positioning for all viewports
- **Touch Support**: Full mobile interaction handling

## 🔧 3D Architecture
```
js/shape/
├── geometry.js    # Pyramid construction
├── animation.js  # Quaternion interpolation
├── interaction.js # Drag/touch handling
└── helpers.js    # Responsive calculations
```

## 🎯 Features
- Smooth drag-to-rotate with realistic physics
- Click faces for content transitions
- Auto-rotation with idle detection
- Mobile-optimized touch controls

Press 'D' for debug controls.
