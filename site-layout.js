// Navigation enhancement; page content and links work without JavaScript.
(()=>{document.querySelectorAll('.tm-nav a').forEach(a=>{a.removeAttribute('aria-current');if(new URL(a.href).pathname===location.pathname)a.setAttribute('aria-current','page');});})();
