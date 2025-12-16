
  # 🌱 Mapeo Verde - Datos Abiertos

  Plataforma de datos abiertos para la gestión de áreas verdes y participación ciudadana.
  
  Este es un proyecto basado en el diseño de Figma disponible en https://www.figma.com/design/6TWtyw3zz38CBFgi8sBwP2/Datos-Abiertos.

  ## 📋 Documentación Importante

  > ⚠️ **IMPORTANTE**: El proyecto fue refactorizado recientemente con nueva estructura y documentación.

  - **[INICIO_RAPIDO.md](./INICIO_RAPIDO.md)** - Resumen ejecutivo y visión general
  - **[ESTRUCTURA_PROYECTO.md](./ESTRUCTURA_PROYECTO.md)** - Guía técnica de la arquitectura
  - **[GUIA_BUENAS_PRACTICAS.md](./GUIA_BUENAS_PRACTICAS.md)** - Convenciones y cómo desarrollar
  - **[RESUMEN_CAMBIOS.md](./RESUMEN_CAMBIOS.md)** - Qué se cambió en la refactorización

  ## 🚀 Comenzar

  ### Instalación
  ```bash
  npm install
  ```

  ### Desarrollo
  ```bash
  npm run dev
  ```

  Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

  ### Build para Producción
  ```bash
  npm run build
  ```

  ## 📁 Estructura del Proyecto

  ```
  src/
  ├── features/              # Features principales organizadas
  ├── components/            # Componentes reutilizables
  ├── context/               # Contextos de React
  ├── hooks/                 # Custom hooks
  ├── constants/             # Constantes de la app
  ├── types/                 # Tipos TypeScript
  ├── utils/                 # Utilidades y helpers
  └── App.tsx                # Componente principal
  ```

  ## ✨ Características

  - 📊 Visualización de datos abiertos
  - 🗺️ Mapas interactivos
  - 📅 Gestión de agenda
  - 🌳 Información de áreas verdes
  - 📰 Boletines y gacetas
  - 💬 Participación ciudadana

  ## 🔧 Tecnologías

  - **React 18** - Framework UI
  - **TypeScript** - Type safety
  - **Vite** - Build tool rápido
  - **Tailwind CSS** - Estilos
  - **React Router** - Enrutamiento
  - **Lucide React** - Iconos
  - **Pigeon Maps** - Mapas
  - **Motion** - Animaciones

  ## 📝 Notas de Refactorización

  Esta versión incluye una refactorización completa:

  ✅ Eliminación de 44 archivos de componentes UI no utilizados
  ✅ Reorganización en estructura de features
  ✅ Implementación de contextos con tipos TypeScript
  ✅ Creación de hooks personalizados
  ✅ Centralización de constantes
  ✅ 4 documentos de referencia para el equipo

  Para más detalles, ver [RESUMEN_CAMBIOS.md](./RESUMEN_CAMBIOS.md).

  ## 👥 Contribución

  Las buenas prácticas para contribuir al proyecto se encuentran en [GUIA_BUENAS_PRACTICAS.md](./GUIA_BUENAS_PRACTICAS.md).

  ## 📞 Ayuda

  - ¿Nuevo en el proyecto? → Lee [INICIO_RAPIDO.md](./INICIO_RAPIDO.md)
  - ¿Necesitas entender la estructura? → Lee [ESTRUCTURA_PROYECTO.md](./ESTRUCTURA_PROYECTO.md)
  - ¿Quieres saber cómo codificar? → Lee [GUIA_BUENAS_PRACTICAS.md](./GUIA_BUENAS_PRACTICAS.md)
  - ¿Necesitas ver los cambios? → Lee [RESUMEN_CAMBIOS.md](./RESUMEN_CAMBIOS.md)

  ## 📄 Licencia

  Este proyecto está bajo licencia MIT.
  