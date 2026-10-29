import React, { useEffect, useRef } from 'react';

/**
 * A transparent, low-resolution caustics field for the landing page. Jittered
 * light cells form irregular refracted seams, composited over the CSS surfaces.
 */
export const AquaticPoolBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const frameInterval = 1000 / 18;
    const maxPixels = 180000;
    let frameId = 0;
    let image = null;
    let lastFrame = 0;
    let isInView = true;
    let columns = 0;
    let rows = 0;
    let cellWidth = 0;
    let cellHeight = 0;
    let siteColumns = 0;
    let siteX = null;
    let siteY = null;
    let siteLight = null;
    let sitePhaseX = null;
    let sitePhaseY = null;
    let siteJitterX = null;
    let siteJitterY = null;

    const fraction = (value) => value - Math.floor(value);
    const hash = (x, y, salt = 0) => fraction(Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453);

    const draw = (time) => {
      if (!image || !siteX) return;

      const siteRows = rows + 2;
      for (let row = 0; row < siteRows; row += 1) {
        const gridY = row - 1;
        for (let column = 0; column < siteColumns; column += 1) {
          const gridX = column - 1;
          const site = row * siteColumns + column;
          siteX[site] = (gridX + 0.5 + (siteJitterX[site] - 0.5) * 0.56) * cellWidth +
            Math.sin(time * 0.3 + sitePhaseX[site]) * cellWidth * 0.12;
          siteY[site] = (gridY + 0.5 + (siteJitterY[site] - 0.5) * 0.56) * cellHeight +
            Math.cos(time * 0.26 + sitePhaseY[site]) * cellHeight * 0.12;
        }
      }

      const pixels = image.data;
      const pixelWidth = image.width;
      const pixelHeight = image.height;
      const invHeight = 1 / pixelHeight;

      for (let y = 0; y < pixelHeight; y += 1) {
        const normalizedY = y * invHeight;
        const gridRow = Math.min(rows - 1, Math.floor(y / cellHeight));
        const rowOffset = y * pixelWidth * 4;
        const surfaceLight = 0.56 + (1 - normalizedY) * 0.44;

        for (let x = 0; x < pixelWidth; x += 1) {
          const gridColumn = Math.min(columns - 1, Math.floor(x / cellWidth));
          let nearestDistance = Infinity;
          let secondDistance = Infinity;
          let nearestSite = -1;
          let secondSite = -1;

          for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            const candidateRow = gridRow + offsetY + 1;
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
              const candidateColumn = gridColumn + offsetX + 1;
              const site = candidateRow * siteColumns + candidateColumn;
              const dx = x - siteX[site];
              const dy = y - siteY[site];
              const distance = dx * dx + dy * dy;

              if (distance < nearestDistance) {
                secondDistance = nearestDistance;
                secondSite = nearestSite;
                nearestDistance = distance;
                nearestSite = site;
              } else if (distance < secondDistance) {
                secondDistance = distance;
                secondSite = site;
              }
            }
          }

          const gap = Math.sqrt(secondDistance) - Math.sqrt(nearestDistance);
          const ridge = Math.max(0, 1 - gap / 21);
          const seam = Math.max(0, 1 - gap / 6.5);
          const cellLight = (siteLight[nearestSite] + siteLight[secondSite]) * 0.5;
          const edgeFalloff = 0.68 + Math.abs(x / pixelWidth - 0.5) * 0.38;
          const alpha = Math.min(
            76,
            (ridge * ridge * 17 + seam * seam * seam * 72) * surfaceLight * edgeFalloff * cellLight
          );
          const index = rowOffset + x * 4;

          pixels[index] = 128;
          pixels[index + 1] = 237;
          pixels[index + 2] = 218;
          pixels[index + 3] = alpha;
        }
      }

      context.putImageData(image, 0, 0);
    };

    const resize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const pixelScale = Math.min(
        window.devicePixelRatio || 1,
        1,
        Math.sqrt(maxPixels / Math.max(1, viewportWidth * viewportHeight)),
        viewportWidth < 768 ? 0.78 : 1
      );
      canvas.width = Math.max(1, Math.round(viewportWidth * pixelScale));
      canvas.height = Math.max(1, Math.round(viewportHeight * pixelScale));
      image = context.createImageData(canvas.width, canvas.height);

      rows = Math.max(4, Math.ceil(canvas.height / 76));
      columns = Math.max(4, Math.ceil(canvas.width / (canvas.height / rows)));
      cellWidth = canvas.width / columns;
      cellHeight = canvas.height / rows;
      siteColumns = columns + 2;
      const siteCount = siteColumns * (rows + 2);
      siteX = new Float32Array(siteCount);
      siteY = new Float32Array(siteCount);
      siteLight = new Float32Array(siteCount);
      sitePhaseX = new Float32Array(siteCount);
      sitePhaseY = new Float32Array(siteCount);
      siteJitterX = new Float32Array(siteCount);
      siteJitterY = new Float32Array(siteCount);

      for (let row = 0; row < rows + 2; row += 1) {
        for (let column = 0; column < siteColumns; column += 1) {
          const gridX = column - 1;
          const gridY = row - 1;
          const site = row * siteColumns + column;
          siteJitterX[site] = hash(gridX, gridY, 1);
          siteJitterY[site] = hash(gridX, gridY, 2);
          siteLight[site] = 0.55 + hash(gridX, gridY, 3) * 0.45;
          sitePhaseX[site] = hash(gridX, gridY, 4) * Math.PI * 2;
          sitePhaseY[site] = hash(gridX, gridY, 5) * Math.PI * 2;
        }
      }

      draw(0);
    };

    const animate = (timestamp) => {
      if (document.hidden || !isInView || motionQuery.matches) return;
      if (timestamp - lastFrame >= frameInterval) {
        lastFrame = timestamp;
        draw(timestamp * 0.0003);
      }
      frameId = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(frameId);
      if (document.hidden || !isInView) return;
      if (motionQuery.matches) {
        draw(0.7);
        return;
      }
      frameId = window.requestAnimationFrame(animate);
    };

    const intersectionObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
      const nextVisibility = entries.some((entry) => entry.isIntersecting);
      if (nextVisibility === isInView) return;
      isInView = nextVisibility;
      if (isInView) {
        start();
      } else {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frameId);
      } else {
        start();
      }
    };

    resize();
    intersectionObserver?.observe(canvas);
    start();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    motionQuery.addEventListener('change', start);

    return () => {
      window.cancelAnimationFrame(frameId);
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', start);
    };
  }, []);

  return (
    <div className="landing-water" aria-hidden="true">
      <canvas ref={canvasRef} className="landing-water__caustics" />
      <div className="landing-water__light" />
    </div>
  );
};