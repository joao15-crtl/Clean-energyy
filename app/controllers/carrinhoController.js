const produtosModel = require('../models/models.js');
const cartModel = require('../models/cartModel');

// GET /carrinho
async function getCarrinho(req, res) {
  try {
    const userId = req.session.userId || req.sessionID;
    const cart = await cartModel.getCartByUser(userId);
    res.render('pages/carrinho', { cart });
  } catch (err) {
    res.status(500).send('Erro ao obter carrinho');
  }
}

// POST /cart/add
async function addToCart(req, res) {
  try {
    const { productId, quantidade } = req.body;
    const produto = await produtosModel.findById(productId);
    if (!produto) return res.status(404).send('Produto não encontrado');
    const userId = req.session.userId || req.sessionID;
    await cartModel.addItem(userId, { productId, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, local: produto.local, quantidade: parseInt(quantidade, 10) || 1 });
    res.redirect('/carrinho');
  } catch (err) {
    res.status(500).send('Erro ao adicionar ao carrinho: ' + err.message);
  }
}

// POST /cart/update — altera a quantidade de um item (JSON)
async function updateQuantidade(req, res) {
  try {
    const userId = req.session.userId || req.sessionID;
    const index = parseInt(req.body.index, 10);
    const quantidade = parseInt(req.body.quantidade, 10);
    if (isNaN(index) || isNaN(quantidade)) {
      return res.status(400).json({ success: false, message: 'Dados inválidos' });
    }

    const salva = await cartModel.updateQuantidade(userId, index, quantidade);
    if (salva === null) {
      return res.status(404).json({ success: false, message: 'Item indisponível' });
    }
    res.json({ success: true, quantidade: salva });
  } catch (err) {
    console.error('Erro ao atualizar quantidade:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar quantidade' });
  }
}

// POST /cart/remove
async function removeFromCart(req, res) {
  try {
    const userId = req.session.userId || req.sessionID;
    await cartModel.removeByIndex(userId, parseInt(req.body.index));
    res.redirect('/carrinho');
  } catch (err) {
    res.status(500).send('Erro ao remover do carrinho');
  }
}

module.exports = { getCarrinho, addToCart, updateQuantidade, removeFromCart };
