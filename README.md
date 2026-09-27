# Brasa Nativa — demo gastronómica

Sitio estático de portafolio creado para AB Web Studio. La marca, dirección, horarios, menú, precios y reseñas son ficticios y existen únicamente con fines demostrativos.

## Vista local

Desde esta carpeta puedes abrir `index.html` directamente. Para una prueba más fiel, inicia un servidor local:

```powershell
python -m http.server 4173
```

Luego visita `http://localhost:4173/`.

## Estructura

- `index.html`: contenido y estructura semántica.
- `styles.css`: diseño responsive, estados y animaciones.
- `script.js`: menú filtrable, carrusel, navegación y modales.
- `assets/`: fotografías optimizadas, poster, favicon y loop WebM locales.

## Publicación futura en GitHub Pages

El sitio usa rutas relativas y no necesita compilación. Cuando sea aprobado, puede subirse a la raíz de un repositorio y activarse GitHub Pages desde la rama principal. No se ha creado repositorio ni publicado esta versión.

## Accesibilidad y rendimiento

- Navegación por teclado, enlace para saltar contenido y estados de foco visibles.
- Elementos interactivos con etiquetas accesibles y textos alternativos.
- Respeto de `prefers-reduced-motion`; el video se oculta en ese modo.
- Portada con recursos separados para orientación vertical y horizontal, poster local de respaldo y pausa automática cuando el dispositivo solicita ahorro de datos.
- Recursos visuales locales y comprimidos; imágenes secundarias con carga diferida.
- Sin backend, rastreadores, fuentes externas ni dependencias en tiempo de ejecución.

## Créditos de recursos

Las fotografías fueron generadas específicamente para esta demostración mediante la herramienta de generación de imágenes de OpenAI. Los loops audiovisuales se compusieron localmente a partir de la imagen original de portada. No se utilizaron recursos de Barber House ni hotlinks de terceros.
