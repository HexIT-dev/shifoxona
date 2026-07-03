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
    
    // Replace catch (error) { alert('Some text'); }
    // or catch (error) { ... alert('Some text'); ... }
    
    // A simpler regex that targets alert('...') inside catch
    content = content.replace(/catch\s*\(([^)]+)\)\s*\{([^}]*)alert\((['"\])(Failed[^'"\]+)\3\);/g, (match, errVar, beforeAlert, quote, errorMsg) => {
        // If it already uses response data, skip
        if (match.includes('response?.data')) return match;
        
        // Add :any if needed
        let errStr = errVar.includes(':') ? errVar : \\: any\;
        
        return \catch (\) {\alert(\.response?.data?.error || \.response?.data?.message || '\');\;
    });
    
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Done replacement');
