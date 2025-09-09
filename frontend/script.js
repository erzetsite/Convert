document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://api.convert.rzsite.my.id/convert';

    // Theme Toggling
    const themeToggle = document.getElementById('theme-toggle');
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');

    const applyTheme = () => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            darkIcon.classList.remove('hidden');
            lightIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            lightIcon.classList.remove('hidden');
            darkIcon.classList.add('hidden');
        }
    };

    themeToggle.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            localStorage.theme = 'light';
        } else {
            localStorage.theme = 'dark';
        }
        applyTheme();
    });

    applyTheme(); // Apply theme on initial load

    // Form elements
    const form = document.getElementById('converter-form');
    const contentInput = document.getElementById('content-input');
    const fileUpload = document.getElementById('file-upload');
    const formatSelect = document.getElementById('format-select');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('spinner');
    const statusMessage = document.getElementById('status-message');

    // File Upload Handler
    fileUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                contentInput.value = e.target.result;
                statusMessage.textContent = `Loaded file: ${file.name}`;
                statusMessage.classList.remove('text-red-500');
                statusMessage.classList.add('text-green-500');
            };
            reader.onerror = () => {
                statusMessage.textContent = 'Error reading file.';
                statusMessage.classList.add('text-red-500');
            };
            reader.readAsText(file);
        }
    });

    // Form Submission Handler
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const content = contentInput.value.trim();
        if (!content) {
            statusMessage.textContent = 'Please enter some content or upload a file.';
            statusMessage.classList.add('text-red-500');
            return;
        }

        // UI state: loading
        submitBtn.disabled = true;
        btnText.textContent = 'Converting...';
        spinner.classList.remove('hidden');
        statusMessage.textContent = '';
        statusMessage.classList.remove('text-red-500', 'text-green-500');

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

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            const contentDisposition = response.headers.get('content-disposition');
            let fileName = 'download';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }
            a.download = fileName;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            statusMessage.textContent = 'Download started successfully!';
            statusMessage.classList.add('text-green-500');

        } catch (error) {
            statusMessage.textContent = `Error: ${error.message}`;
            statusMessage.classList.add('text-red-500');
        } finally {
            // UI state: reset
            submitBtn.disabled = false;
            btnText.textContent = 'Convert & Download';
            spinner.classList.add('hidden');
        }
    });
});
