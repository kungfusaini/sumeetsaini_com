# Sumeet Saini - 3D Pyramid Personal Website

Interactive 3D pyramid built with Three.js. Drag to rotate, click faces to explore content.

## 🎮 3D Implementation
- **Custom Tetrahedron**: Programmatic geometry with BufferGeometry
- **Quaternion Rotation**: Gimbal-lock-free smooth rotations
- **Composite Textures**: Canvas-based faces with grain overlays

## ⚡ Performance
- **60fps Loop**: RequestAnimationFrame with GPU acceleration
- **Physics Simulation**: Momentum-based drag with velocity damping
- **Responsive Camera**: Dynamic positioning for all viewports
- **Touch Support**: Full mobile interaction handling

## 🎯 Features
- Smooth drag-to-rotate with realistic physics
- Click faces for content (About, Blog, Contact, Now - auto-loads latest month)
- Contact form with email integration
- Auto-rotation with idle detection
- Mobile-optimized touch controls

Press 'D' for debug controls.

## Development

This project is part of [Aether](https://github.com/kungfusaini/aether) unified Docker setup.

### Running with Aether (Recommended)
```bash
# Clone Aether project
git clone https://github.com/kungfusaini/aether.git
cd aether

# Start development environment
docker compose -f docker-compose.yml -f docker-compose-dev.yml up -d
```

### Local Development
```bash
npm run dev
```



