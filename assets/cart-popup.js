(function () {
  var DEC_SVG =
    '<svg class="fill-current text-white" width="12" height="2" viewBox="0 0 14 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.4361 0.203613H12.0736L7.81774 0.203615H13.8729V1.80309H7.81774L3.50809 1.80309H1.87053L6.18017 1.80309H0.125V0.203615H6.18017L10.4361 0.203613Z"/></svg>';
  var INC_SVG =
    '<svg class="fill-current text-white" width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.18017 0.110352H7.81774V6.16553H13.8729V7.76501H7.81774V13.8963H6.18017V7.76501H0.125V6.16553H6.18017V0.110352Z"/></svg>';
  var CLOSE_SVG =
    '<svg class="fill-current text-white! duration-300 group-hover:text-white" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.636719 1.56306L1.56306 0.636719L4.98839 4.06204L8.41371 0.636719L9.31851 1.54152L5.89319 4.96685L9.3616 8.43526L8.43526 9.3616L4.96685 5.89319L1.54152 9.31851L0.636719 8.41371L4.06204 4.98839L0.636719 1.56306Z"/></svg>';

  var isUpdating = false;

  function getPopup() {
    return document.querySelector('[data-cart-popup]');
  }

  function getListRoot() {
    return document.querySelector('[data-cart-list]');
  }

  function getMoneyFormat() {
    var popup = getPopup();
    return (popup && popup.dataset.moneyFormat) || '${{amount}}';
  }

  function formatMoney(cents, format) {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return window.Shopify.formatMoney(cents, format || getMoneyFormat());
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

  function updateCount(count) {
    var countEl = document.querySelector('[data-cart-count]');
    if (!countEl) return;

    countEl.textContent = String(count);

    if (count > 0) {
      countEl.classList.remove('hidden');
    } else {
      countEl.classList.add('hidden');
    }
  }

  function buildItemHtml(item) {
    var type = item.product_type || '';
    var typeHtml = type
      ? '<span class="text-[14px] md:text-[15px] leading-none block text-white">' + escapeHtml(type) + '</span>'
      : '';
    var imageHtml = item.image
      ? '<img class="cart-popup-image w-[70px] max-w-[70px] h-[70px] shrink-0 object-cover" src="' +
        escapeHtml(item.image) +
        '" alt="' +
        escapeHtml(item.product_title || item.title) +
        '" loading="lazy" width="70" height="70">'
      : '<div class="w-[70px] h-[70px] bg-white/10 shrink-0"></div>';

    return (
      '<div class="flex gap-[15px] relative pb-[15px] mb-[15px] border-b border-bdr-clr dark:border-bdr-clr-drk group" data-cart-line data-line-key="' +
      escapeHtml(item.key) +
      '">' +
      '<a href="' +
      escapeHtml(item.url) +
      '" class="block shrink-0">' +
      imageHtml +
      '</a>' +
      '<div class="flex-1 min-w-0 pr-6">' +
      '<div class="flex items-center gap-2 flex-wrap">' +
      typeHtml +
      (typeHtml ? '<span class="w-[6px] h-[6px] rounded-full bg-primary shrink-0"></span>' : '') +
      '<span class="text-[14px] md:text-[15px] leading-none block text-white">' +
      escapeHtml(formatMoney(item.final_price)) +
      '</span>' +
      '</div>' +
      '<h6 class="text-base md:text-lg font-semibold !leading-none mt-[10px] text-white">' +
      '<a href="' +
      escapeHtml(item.url) +
      '" class="text-white hover:text-primary transition-all duration-300">' +
      escapeHtml(item.product_title || item.title) +
      '</a>' +
      '</h6>' +
      '<div class="inc-dec flex items-center gap-2 mt-4">' +
      '<button type="button" class="dec w-6 h-6 bg-white/10 flex items-center justify-center cursor-pointer" data-cart-qty-dec aria-label="Decrease quantity">' +
      DEC_SVG +
      '</button>' +
      '<input class="w-6 h-auto outline-none bg-transparent text-base md:text-lg leading-none text-white text-center pointer-events-none" type="text" value="' +
      escapeHtml(item.quantity) +
      '" data-cart-qty-input readonly tabindex="-1">' +
      '<button type="button" class="inc w-6 h-6 bg-white/10 flex items-center justify-center cursor-pointer" data-cart-qty-inc aria-label="Increase quantity">' +
      INC_SVG +
      '</button>' +
      '</div>' +
      '</div>' +
      '<button type="button" class="wishList_item_close absolute top-0 right-0 w-6 h-6 flex items-center justify-center text-white bg-white/10 duration-300 hover:bg-primary cursor-pointer" data-cart-remove aria-label="Remove from cart">' +
      CLOSE_SVG +
      '</button>' +
      '</div>'
    );
  }

  function render(cart) {
    var listRoot = getListRoot();
    if (!listRoot) return;

    var popup = getPopup();
    var emptyEl = listRoot.querySelector('[data-cart-empty]');
    var footerEl = document.querySelector('[data-cart-footer]');
    var subtotalEl = document.querySelector('[data-cart-subtotal]');
    var items = (cart && cart.items) || [];

    listRoot.querySelectorAll('[data-cart-line]').forEach(function (node) {
      node.remove();
    });

    updateCount(cart ? cart.item_count : 0);

    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(cart ? cart.total_price : 0);
    }

    if (items.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (footerEl) footerEl.classList.add('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    if (footerEl) footerEl.classList.remove('hidden');

    items.forEach(function (item) {
      listRoot.insertAdjacentHTML('beforeend', buildItemHtml(item));
    });

    if (popup) {
      popup.dataset.cartItemCount = String(items.length);
    }
  }

  function fetchCart() {
    return fetch('/cart.js', {
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      return response.json();
    });
  }

  function refresh() {
    return fetchCart().then(function (cart) {
      render(cart);
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cart } }));
      return cart;
    });
  }

  function changeLineQuantity(lineKey, quantity) {
    if (isUpdating) return Promise.resolve();

    isUpdating = true;

    return fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        id: lineKey,
        quantity: quantity
      })
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (cart) {
        if (cart.status && cart.message) {
          throw new Error(cart.description || cart.message);
        }
        render(cart);
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cart } }));
        return cart;
      })
      .catch(function (error) {
        if (error && error.message) {
          window.alert(error.message);
        }
        return refresh();
      })
      .finally(function () {
        isUpdating = false;
      });
  }

  function openPopup() {
    var popup = document.querySelector('.hdr_cart_popup');
    if (!popup) return;
    popup.classList.remove('invisible', 'opacity-0');
  }

  function closePopup() {
    var popup = document.querySelector('.hdr_cart_popup');
    if (!popup) return;
    popup.classList.add('invisible', 'opacity-0');
  }

  function addAndOpen() {
    return refresh().then(function () {
      openPopup();
    });
  }

  document.addEventListener('click', function (event) {
    var listRoot = getListRoot();
    if (!listRoot) return;

    var row = event.target.closest('[data-cart-line]');
    if (!row || !listRoot.contains(row)) return;

    var lineKey = row.dataset.lineKey;
    var qtyInput = row.querySelector('[data-cart-qty-input]');
    var currentQty = parseInt(qtyInput ? qtyInput.value : '1', 10) || 1;

    if (event.target.closest('[data-cart-qty-dec]')) {
      event.preventDefault();
      changeLineQuantity(lineKey, Math.max(0, currentQty - 1));
      return;
    }

    if (event.target.closest('[data-cart-qty-inc]')) {
      event.preventDefault();
      changeLineQuantity(lineKey, currentQty + 1);
      return;
    }

    if (event.target.closest('[data-cart-remove]')) {
      event.preventDefault();
      event.stopPropagation();
      changeLineQuantity(lineKey, 0);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    refresh();
  });

  window.FurnixarCart = {
    refresh: refresh,
    openPopup: openPopup,
    closePopup: closePopup,
    addAndOpen: addAndOpen,
    render: render
  };
})();
