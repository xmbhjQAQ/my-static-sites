# Self-hosted report dependencies

The radar chart and image export work without an external CDN. These are the
unmodified npm distribution files, loaded only when needed:

| File | npm package | License |
| --- | --- | --- |
| chart.umd-4.4.1.js | chart.js@4.4.1, dist/chart.umd.js | chart.js-LICENSE.md |
| html2canvas-1.4.1.min.js | html2canvas@1.4.1, dist/html2canvas.min.js | html2canvas-LICENSE |

To update, download an explicitly versioned npm package, copy its distribution
file and license, update js/dependencies.js, then run the regression tests.
