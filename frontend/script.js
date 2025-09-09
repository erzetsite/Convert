document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://api.convert.rzsite.my.id/convert';
    
    // Theme Management
    const themes = ['main', 'moon', 'dawn'];
    let currentThemeIndex = 0;
    
    const themeCycle = document.getElementById('theme-cycle');
    const html = document.documentElement;
    
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('rp-theme', theme);
        
        const icons = {
            main: '🌸',
            moon: '🌙', 
            dawn: '🌅'
        };
        themeCycle.innerHTML = `<span class="text-lg">${icons[theme]}</span>`;
    }
    
    function cycleTheme() {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme(themes[currentThemeIndex]);
    }
    
    const savedTheme = localStorage.getItem('rp-theme') || 'main';
    currentThemeIndex = themes.indexOf(savedTheme);
    if (currentThemeIndex === -1) currentThemeIndex = 0;
    applyTheme(themes[currentThemeIndex]);
    
    themeCycle.addEventListener('click', cycleTheme);
    
    // Form elements
    const form = document.getElementById('converter-form');
    const contentInput = document.getElementById('content-input');
    const fileUpload = document.getElementById('file-upload');
    const formatSelect = document.getElementById('format-select');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('spinner');
    const statusMessage = document.getElementById('status-message');

    // 🔥 FIXED: Enhanced file upload with better validation
    const fileUploadLabel = document.querySelector('.file-upload-label');
    
    function handleFileUpload(file) {
        if (!file) return;
        
        const validExtensions = ['.txt', '.md', '.json', '.tex', '.docx', '.pdf'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!validExtensions.includes(fileExtension)) {
            showStatus('❌ Please upload a valid file (.txt, .md, .json, .tex)', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showStatus('❌ File too large. Maximum size is 10MB.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            contentInput.value = e.target.result;
            showStatus(`✅ Loaded: ${file.name}`, 'success');
            
            // Auto-select format based on file extension
            if (fileExtension === '.json') {
                formatSelect.value = 'xlsx';
            } else if (fileExtension === '.tex') {
                formatSelect.value = 'docx';
            } else if (fileExtension === '.md') {
                formatSelect.value = 'pdf';
            }
        };
        
        reader.onerror = () => {
            showStatus('❌ Error reading file', 'error');
        };
        
        reader.readAsText(file);
    }
    
    fileUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        handleFileUpload(file);
    });
    
    // Drag and Drop
    fileUploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadLabel.style.borderColor = 'var(--rp-iris)';
        fileUploadLabel.style.background = 'var(--rp-overlay)';
    });
    
    fileUploadLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadLabel.style.borderColor = 'var(--rp-highlight-med)';
        fileUploadLabel.style.background = 'var(--rp-surface)';
    });
    
    fileUploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadLabel.style.borderColor = 'var(--rp-highlight-med)';
        fileUploadLabel.style.background = 'var(--rp-surface)';
        
        const file = e.dataTransfer.files[0];
        handleFileUpload(file);
    });
    
    // Status message helper
    function showStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.className = 'text-center text-sm min-h-[1.5rem] font-medium';
        
        switch(type) {
            case 'success':
                statusMessage.classList.add('status-success');
                break;
            case 'error':
                statusMessage.classList.add('status-error');
                break;
            case 'warning':
                statusMessage.classList.add('status-warning');
                break;
            default:
                statusMessage.style.color = 'var(--rp-subtle)';
        }
        
        if (type !== 'error' && type !== 'warning') {
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.className = 'text-center text-sm min-h-[1.5rem] font-medium';
            }, 5000);
        }
    }
    
    // 🔥 FIXED: Better download handling
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const content = contentInput.value.trim();
        if (!content) {
            showStatus('Please enter some content or upload a file', 'error');
            return;
        }
        
        // UI state: loading
        submitBtn.disabled = true;
        btnText.textContent = 'Converting...';
        spinner.classList.remove('hidden');
        showStatus('🔄 Converting your file...', 'info');
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    format: formatSelect.value,
                    content: content,
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            
            // 🔥 FIXED: Force download with proper filename
            const blob = await response.blob();
            
            // Get filename from response headers
            const contentDisposition = response.headers.get('content-disposition');
            let fileName = `converted.${formatSelect.value}`;
            
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }
            
            // 🔥 FIXED: Create download link and trigger it
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            
            // Append to body, click, and cleanup
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
            
            showStatus(`✅ Successfully downloaded: ${fileName}`, 'success');
            
        } catch (error) {
            console.error('Conversion error:', error);
            showStatus(`❌ Error: ${error.message}`, 'error');
        } finally {
            // UI state: reset
            submitBtn.disabled = false;
            btnText.textContent = 'Convert & Download';
            spinner.classList.add('hidden');
        }
    });
    
    // Auto-resize textarea
    contentInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 500) + 'px';
    });
    
    // Example content loader
    const examples = {
        docx: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\title{Sample Document}
\\begin{document}
\\maketitle
This is a sample LaTeX document that will be converted to Word format.
\\end{document}`,
        xlsx: `[{"Nama":"Faza","Nilai":90},{"Nama":"Akhyar","Nilai":85},{"Nama":"Budi","Nilai":95}]`,
        pdf: `# Sample Document

This is a sample markdown document that will be converted to PDF format.

## Features
- Beautiful formatting
- Professional layout
- Easy conversion

## Mathematical Expression
The quadratic formula: x = (-b ± √(b² - 4ac)) / 2a`,
        md: `# Markdown Document

This will be converted to **Markdown** format.

## Features
- *Italic text*
- **Bold text**
- \`Code snippets\`

### Lists
1. Numbered lists
2. Easy formatting
3. Professional output`,
        txt: `This is plain text content that can be converted to any format.
It supports multiple lines and basic formatting will be preserved.`
    };
    
    formatSelect.addEventListener('change', function() {
        if (!contentInput.value.trim()) {
            contentInput.value = examples[this.value] || '';
            contentInput.style.height = 'auto';
            contentInput.style.height = Math.min(contentInput.scrollHeight, 500) + 'px';
        }
    });
});
