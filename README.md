# Emiliano Health Dashboard

Un dashboard personal de salud y fitness construido con React + Tailwind CSS.

## Features

- Subir archivos GPX/TCX/FIT y visualizar rutas en mapa + métricas
- Subir PDFs de InBody y extraer datos automáticamente
- Gráficas de progreso histórico
- Diseño oscuro moderno y responsivo

## Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express (opcional)
- **Librerías**: leaflet (mapas), recharts (gráficas), pdf-parse (PDFs), fit-file-parser (archivos FIT)
- **Deploy**: Netlify (frontend) + Render (backend)

## Instalación

```bash
npm install
npm run dev
```

## Estructura del Proyecto

```
emiliano-health-dashboard/
├── src/
│   ├── components/
│   │   ├── MapComponent.jsx
│   │   └── ProgressChart.jsx
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Uso

1. Sube un archivo GPX para visualizar tu ruta y métricas
2. Sube un PDF de InBody para extraer datos automáticamente
3. Visualiza tu progreso histórico en las gráficas

## Contribución

Las contribuciones son bienvenidas. Por favor abre un issue o pull request.

## Licencia

MIT