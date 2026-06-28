(function () {
  var STORAGE_KEY = 'furnixar_wishlist';

  function getItems() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { items: items } }));
  }

  function formatMoney(cents, format) {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return window.Shopify.formatMoney(cents, format || '${{amount}}');
    }
    return (cents / 100).toFixed(2);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getListRoot() {
    return document.querySelector('[data-wishlist-list]');
  }

  function getMoneyFormat() {
    var root = getListRoot();
    return (root && root.dataset.moneyFormat) || '${{amount}}';
  }

  function updateCount() {
    var items = getItems();
    var countEl = document.querySelector('[data-wishlist-count]');
    if (!countEl) return;

    countEl.textContent = String(items.length);

    if (items.length > 0) {
      countEl.classList.remove('hidden');
    } else {
      countEl.classList.add('hidden');
    }
  }

  function buildItemHtml(item) {
    var typeHtml = item.type
      ? '<span class="text-[14px] md:text-[15px] leading-none block text-white">' + escapeHtml(item.type) + '</span>'
      : '';
    var imageHtml = item.image
      ? '<img class="max-w-[70px]! w-[70px] md:w-auto" src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" loading="lazy" width="70" height="70">'
      : '<div class="w-[70px] h-[70px] bg-white/10 shrink-0"></div>';

    return (
      '<a href="' +
      escapeHtml(item.url) +
      '" class="flex items-center gap-[15px] relative pb-[15px] mb-[15px] border-b border-bdr-clr dark:border-bdr-clr-drk" data-wishlist-item data-product-id="' +
      escapeHtml(item.productId) +
      '">' +
      imageHtml +
      '<div>' +
      '<div class="flex items-center gap-2">' +
      typeHtml +
      (typeHtml ? '<span class="w-[6px] h-[6px] rounded-full bg-primary"></span>' : '') +
      '<span class="text-[14px] md:text-[15px] leading-none block text-white">' +
      escapeHtml(item.priceFormatted) +
      '</span>' +
      '</div>' +
      '<h6 class="text-base md:text-lg font-semibold leading-none mt-3 text-white hover:text-primary transition-all duration-300">' +
      escapeHtml(item.title) +
      '</h6>' +
      '</div>' +
      '<div class="wishList_item_close absolute top-0 right-0 w-6 h-6 flex items-center justify-center text-white bg-title dark:bg-white bg-opacity-10 dark:bg-opacity-10 group duration-300 hover:bg-primary dark:hover:bg-primary cursor-pointer" data-wishlist-remove data-product-id="' +
      escapeHtml(item.productId) +
      '" role="button" tabindex="0" aria-label="Remove from wishlist">' +
      '<svg class="fill-current text-white! duration-300 group-hover:text-white" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M0.636719 1.56306L1.56306 0.636719L4.98839 4.06204L8.41371 0.636719L9.31851 1.54152L5.89319 4.96685L9.3616 8.43526L8.43526 9.3616L4.96685 5.89319L1.54152 9.31851L0.636719 8.41371L4.06204 4.98839L0.636719 1.56306Z"/>' +
      '</svg>' +
      '</div>' +
      '</a>'
    );
  }

  function render() {
    var listRoot = getListRoot();
    if (!listRoot) return;

    var items = getItems();
    var emptyEl = listRoot.querySelector('[data-wishlist-empty]');

    listRoot.querySelectorAll('[data-wishlist-item]').forEach(function (node) {
      node.remove();
    });

    if (items.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      updateCount();
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    items.forEach(function (item) {
      listRoot.insertAdjacentHTML('beforeend', buildItemHtml(item));
    });

    updateCount();
  }

  function addFromButton(button) {
    if (!button) return false;

    var productId = button.dataset.productId;
    if (!productId) return false;

    var price = parseInt(button.dataset.productPrice, 10) || 0;
    var item = {
      productId: productId,
      variantId: button.dataset.variantId || '',
      title: button.dataset.productTitle || '',
      url: button.dataset.productUrl || '#',
      type: button.dataset.productType || '',
      price: price,
      priceFormatted: formatMoney(price, getMoneyFormat()),
      image: button.dataset.productImage || ''
    };

    var items = getItems();
    var existingIndex = items.findIndex(function (entry) {
      return String(entry.productId) === String(productId);
    });

    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.unshift(item);
    }

    saveItems(items);
    render();
    return true;
  }

  function removeByProductId(productId) {
    var items = getItems().filter(function (item) {
      return String(item.productId) !== String(productId);
    });
    saveItems(items);
    render();
  }

  function openPopup() {
    var popup = document.querySelector('.wishlist_popup');
    if (!popup) return;
    popup.classList.remove('invisible', 'opacity-0');
  }

  document.addEventListener('click', function (event) {
    var addBtn = event.target.closest('[data-add-wishlist]');
    if (addBtn) {
      event.preventDefault();
      if (addFromButton(addBtn)) {
        openPopup();
      }
      return;
    }

    var removeBtn = event.target.closest('[data-wishlist-remove]');
    if (removeBtn) {
      event.preventDefault();
      event.stopPropagation();
      removeByProductId(removeBtn.dataset.productId);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    var removeBtn = event.target.closest('[data-wishlist-remove]');
    if (!removeBtn) return;

    event.preventDefault();
    removeByProductId(removeBtn.dataset.productId);
  });

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('wishlist:updated', updateCount);

  window.FurnixarWishlist = {
    getItems: getItems,
    addFromButton: addFromButton,
    removeByProductId: removeByProductId,
    render: render
  };
})();
