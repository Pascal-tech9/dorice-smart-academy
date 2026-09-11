// Dorice Smart Academy — light client-side helpers
// (Bootstrap handles navbar toggling; this file is for small UX touches.)

(function () {
  // Year stamp in footer (if you add one)
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Auto-dismiss success/info alerts after 5s
  setTimeout(() => {
    document.querySelectorAll('.alert-success, .alert-info').forEach(el => {
      if (window.bootstrap) {
        const inst = window.bootstrap.Alert.getOrCreateInstance(el);
        if (inst) inst.close();
      }
    });
  }, 5000);
})();
