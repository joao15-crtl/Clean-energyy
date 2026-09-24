const pool = require("../../config/pool_conexoes");

// Os itens guardam uma cópia do produto de quando foram adicionados;
// aqui substituímos pelos dados atuais para refletir edições do vendedor.
async function atualizarComProdutos(items) {
  const ids = [...new Set(items.map(i => i.productId).filter(Boolean))];
  if (ids.length === 0) return items;

  const [produtos] = await pool.query(
    "SELECT id, nome, descricao, preco, imagem, local, quantidade FROM produtos WHERE id IN (?)",
    [ids]
  );
  const porId = new Map(produtos.map(p => [String(p.id), p]));

  return items.map(item => {
    const produto = porId.get(String(item.productId));
    if (!produto) return { ...item, disponivel: 0 };
    return {
      ...item,
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      imagem: produto.imagem,
      local: produto.local,
      disponivel: Number(produto.quantidade) || 0
    };
  });
}

const cartModel = {
  // Adiciona um item ao carrinho do usuário
  addItem: async (userId, item) => {
    try {
      let [cartRows] = await pool.query("SELECT idCarrinho, items FROM carrinho WHERE userId = ?", [userId]);
      let cartId, items;

      if (cartRows.length === 0) {
        items = [item];
        const [result] = await pool.query("INSERT INTO carrinho (userId, items) VALUES (?, ?)", [userId, JSON.stringify(items)]);
        cartId = result.insertId;
      } else {
        cartId = cartRows[0].idCarrinho;
        const existingItems = cartRows[0].items;
        if (Array.isArray(existingItems)) {
          items = existingItems;
        } else if (typeof existingItems === 'string') {
          items = JSON.parse(existingItems || '[]');
        } else {
          items = Array.isArray(existingItems) ? existingItems : [existingItems];
        }
        const existingIndex = items.findIndex(i => i.productId === item.productId);
        if (existingIndex >= 0) {
          items[existingIndex].quantidade += item.quantidade;
        } else {
          items.push(item);
        }
        await pool.query("UPDATE carrinho SET items = ? WHERE idCarrinho = ?", [JSON.stringify(items), cartId]);
      }
      return { cartId, items };
    } catch (err) {
      throw err;
    }
  },

  // Obtém o carrinho do usuário
  getCartByUser: async (userId) => {
    try {
      const [rows] = await pool.query("SELECT items FROM carrinho WHERE userId = ?", [userId]);
      if (rows.length === 0) return [];

      const items = rows[0].items;
      // Verificar se já é um array ou precisa ser parseado
      let lista;
      if (Array.isArray(items)) {
        lista = items;
      } else if (typeof items === 'string') {
        lista = JSON.parse(items || '[]');
      } else {
        // Se for um objeto, tentar converter
        lista = Array.isArray(items) ? items : [items];
      }
      return await atualizarComProdutos(lista);
    } catch (err) {
      throw err;
    }
  },

  // Altera a quantidade de um item por índice, limitada ao estoque do produto.
  // Retorna a quantidade salva, ou null se o item não existir.
  updateQuantidade: async (userId, index, quantidade) => {
    try {
      const [rows] = await pool.query("SELECT idCarrinho, items FROM carrinho WHERE userId = ?", [userId]);
      if (rows.length === 0) return null;
      const cartId = rows[0].idCarrinho;
      const existingItems = rows[0].items;

      let items;
      if (Array.isArray(existingItems)) {
        items = existingItems;
      } else if (typeof existingItems === 'string') {
        items = JSON.parse(existingItems || '[]');
      } else {
        items = Array.isArray(existingItems) ? existingItems : [existingItems];
      }
      if (!(index >= 0 && index < items.length)) return null;

      const [produtos] = await pool.query("SELECT quantidade FROM produtos WHERE id = ?", [items[index].productId]);
      const maximo = produtos.length ? Math.floor(Number(produtos[0].quantidade) || 0) : 0;
      if (maximo < 1) return null;

      items[index].quantidade = Math.min(Math.max(quantidade, 1), maximo);
      await pool.query("UPDATE carrinho SET items = ? WHERE idCarrinho = ?", [JSON.stringify(items), cartId]);
      return items[index].quantidade;
    } catch (err) {
      throw err;
    }
  },

  // Remove um item do carrinho por índice
  removeByIndex: async (userId, index) => {
    try {
      const [rows] = await pool.query("SELECT idCarrinho, items FROM carrinho WHERE userId = ?", [userId]);
      if (rows.length === 0) return;
      const cartId = rows[0].idCarrinho;
      const existingItems = rows[0].items;

      let items;
      if (Array.isArray(existingItems)) {
        items = existingItems;
      } else if (typeof existingItems === 'string') {
        items = JSON.parse(existingItems || '[]');
      } else {

        items = Array.isArray(existingItems) ? existingItems : [existingItems];
      }
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
        await pool.query("UPDATE carrinho SET items = ? WHERE idCarrinho = ?", [JSON.stringify(items), cartId]);
      }
    } catch (err) {
      throw err;
    }
  }
};

module.exports = cartModel;