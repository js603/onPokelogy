fetch('https://raw.githubusercontent.com/lowlighter/gracidea/main/maps/gracidea.world')
  .then(r=>r.json())
  .then(d => {
    let minX=-3040, maxX=15248, minY=-5792, maxY=4224;
    let width = maxX - minX;
    let height = maxY - minY;
    
    let result = {};
    d.maps.forEach(m => {
        let nameMatch = m.fileName.match(/hoenn\/(.*?)\.tmx/);
        if(nameMatch) {
            let name = nameMatch[1];
            // Normalize name
            // "hoenn-route-101" -> "Route 101" etc.
            let formattedName = name;
            if (name.startsWith('hoenn-')) {
                formattedName = name.replace('hoenn-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            } else {
                formattedName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
            
            let cx = m.x + m.width / 2;
            let cy = m.y + m.height / 2;
            
            let px = ((cx - minX) / width) * 100;
            let py = ((cy - minY) / height) * 100;
            
            // Just for testing, store them
            result[name] = { x: Math.round(px), y: Math.round(py) };
        }
    });
    console.log(JSON.stringify(result, null, 2));
  });
