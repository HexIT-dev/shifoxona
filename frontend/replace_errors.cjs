const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace catch (error) { ... alert('Failed...'); ... }
    content = content.replace(/catch\s*\(([^)]+)\)\s*\{([^}]*)alert\((['"`])(Failed[^'"`]+)\3\);/g, (match, errVar, beforeAlert, quote, errorMsg) => {
        if (match.includes('response?.data')) return match;
        
        let errStr = errVar.includes(':') ? errVar : `${errVar}: any`;
        
        return `catch (${errStr}) {${beforeAlert}alert(${errVar}.response?.data?.error || ${errVar}.response?.data?.message || '${errorMsg}');`;
    });
    
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Done replacement');
