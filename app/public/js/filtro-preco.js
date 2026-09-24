// Impede valores negativos no filtro de preço e garante mínimo <= máximo
document.addEventListener('DOMContentLoaded', function() {
  const precoMin = document.querySelector('input[name="precoMin"]');
  const precoMax = document.querySelector('input[name="precoMax"]');
  if (!precoMin || !precoMax) return;

  [precoMin, precoMax].forEach(input => {
    // Bloqueia sinal de menos, "+" e notação científica ("e")
    input.addEventListener('keydown', function(e) {
      if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
    });

    // Cobre valores colados ou digitados de outra forma
    input.addEventListener('input', function() {
      if (this.value !== '' && Number(this.value) < 0) this.value = '';
      validarIntervalo();
    });
  });

  function validarIntervalo() {
    const min = precoMin.value === '' ? null : Number(precoMin.value);
    const max = precoMax.value === '' ? null : Number(precoMax.value);
    const invalido = min !== null && max !== null && min > max;
    precoMax.setCustomValidity(invalido ? 'O preço máximo deve ser maior ou igual ao mínimo.' : '');
  }

  validarIntervalo();
});
