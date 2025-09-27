// Kitchen Printer Utility
export interface PrintableOrder {
  id: string;
  table_number: string;
  unique_code: string;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    menu?: {
      name: string;
      category: string;
      description?: string;
    };
  }>;
}

export const printOrderSummary = (order: PrintableOrder): void => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to enable kitchen printing');
    return;
  }

  const orderTime = new Date(order.created_at).toLocaleString();
  const currentTime = new Date().toLocaleString();

  // Group items by category for better kitchen organization
  const itemsByCategory = order.order_items.reduce((acc, item) => {
    const category = item.menu?.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof order.order_items>);

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kitchen Order - Table ${order.table_number}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
          background: white;
          color: black;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .restaurant-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .order-info {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .table-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .category-section {
          margin-bottom: 20px;
        }
        .category-header {
          font-weight: bold;
          font-size: 14px;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          margin-bottom: 8px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          padding-left: 10px;
        }
        .item-name {
          flex: 1;
          font-weight: bold;
        }
        .item-description {
          font-size: 10px;
          color: #666;
          font-style: italic;
          margin-left: 10px;
          margin-top: 2px;
        }
        .quantity {
          font-weight: bold;
          min-width: 30px;
          text-align: right;
        }
        .footer {
          border-top: 2px solid #000;
          padding-top: 10px;
          margin-top: 20px;
          text-align: center;
          font-size: 10px;
        }
        .priority {
          background: #ffeb3b;
          padding: 5px;
          text-align: center;
          font-weight: bold;
          margin-bottom: 15px;
          border: 2px solid #000;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">ORDEREASE KITCHEN</div>
        <div>Kitchen Order Ticket</div>
      </div>

      <div class="priority">
        🔥 PREPARE NOW 🔥
      </div>

      <div class="order-info">
        <div class="table-info">
          <span>TABLE: ${order.table_number}</span>
          <span>ORDER: ${order.unique_code}</span>
        </div>
        <div class="table-info">
          <span>Ordered: ${orderTime}</span>
          <span>Printed: ${currentTime}</span>
        </div>
      </div>

      ${Object.entries(itemsByCategory).map(([category, items]) => `
        <div class="category-section">
          <div class="category-header">${category}</div>
          ${items.map(item => `
            <div class="item">
              <div>
                <div class="item-name">${item.menu?.name || 'Unknown Item'}</div>
                ${item.menu?.description ? `<div class="item-description">${item.menu.description}</div>` : ''}
              </div>
              <div class="quantity">×${item.quantity}</div>
            </div>
          `).join('')}
        </div>
      `).join('')}

      <div class="footer">
        <div>Order ID: ${order.id}</div>
        <div>Printed at ${currentTime}</div>
        <div style="margin-top: 10px; font-weight: bold;">
          ⚡ PRIORITY ORDER - PREPARE IMMEDIATELY ⚡
        </div>
      </div>

      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Print Order
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
          Close
        </button>
      </div>

      <script>
        // Auto-print when page loads
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
        
        // Close window after printing
        window.onafterprint = function() {
          setTimeout(function() {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
};

export const showPrintPreview = (order: PrintableOrder): void => {
  // For testing/preview purposes - shows the print layout without auto-printing
  const previewWindow = window.open('', '_blank', 'width=400,height=600');
  
  if (!previewWindow) {
    alert('Please allow popups to preview kitchen orders');
    return;
  }

  const orderTime = new Date(order.created_at).toLocaleString();
  const currentTime = new Date().toLocaleString();

  const itemsByCategory = order.order_items.reduce((acc, item) => {
    const category = item.menu?.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof order.order_items>);

  const previewContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kitchen Order Preview - Table ${order.table_number}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
          background: white;
          color: black;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .restaurant-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .order-info {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .table-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .category-section {
          margin-bottom: 20px;
        }
        .category-header {
          font-weight: bold;
          font-size: 14px;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          margin-bottom: 8px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          padding-left: 10px;
        }
        .item-name {
          flex: 1;
          font-weight: bold;
        }
        .item-description {
          font-size: 10px;
          color: #666;
          font-style: italic;
          margin-left: 10px;
          margin-top: 2px;
        }
        .quantity {
          font-weight: bold;
          min-width: 30px;
          text-align: right;
        }
        .footer {
          border-top: 2px solid #000;
          padding-top: 10px;
          margin-top: 20px;
          text-align: center;
          font-size: 10px;
        }
        .priority {
          background: #ffeb3b;
          padding: 5px;
          text-align: center;
          font-weight: bold;
          margin-bottom: 15px;
          border: 2px solid #000;
        }
        .preview-notice {
          background: #e3f2fd;
          border: 2px solid #2196f3;
          padding: 10px;
          margin-bottom: 15px;
          text-align: center;
          font-weight: bold;
          color: #1976d2;
        }
      </style>
    </head>
    <body>
      <div class="preview-notice">
        📋 KITCHEN ORDER PREVIEW 📋
      </div>

      <div class="header">
        <div class="restaurant-name">ORDEREASE KITCHEN</div>
        <div>Kitchen Order Ticket</div>
      </div>

      <div class="priority">
        🔥 PREPARE NOW 🔥
      </div>

      <div class="order-info">
        <div class="table-info">
          <span>TABLE: ${order.table_number}</span>
          <span>ORDER: ${order.unique_code}</span>
        </div>
        <div class="table-info">
          <span>Ordered: ${orderTime}</span>
          <span>Preview: ${currentTime}</span>
        </div>
      </div>

      ${Object.entries(itemsByCategory).map(([category, items]) => `
        <div class="category-section">
          <div class="category-header">${category}</div>
          ${items.map(item => `
            <div class="item">
              <div>
                <div class="item-name">${item.menu?.name || 'Unknown Item'}</div>
                ${item.menu?.description ? `<div class="item-description">${item.menu.description}</div>` : ''}
              </div>
              <div class="quantity">×${item.quantity}</div>
            </div>
          `).join('')}
        </div>
      `).join('')}

      <div class="footer">
        <div>Order ID: ${order.id}</div>
        <div>Preview generated at ${currentTime}</div>
        <div style="margin-top: 10px; font-weight: bold;">
          ⚡ PRIORITY ORDER - PREPARE IMMEDIATELY ⚡
        </div>
      </div>

      <div style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Print This Order
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
          Close Preview
        </button>
      </div>
    </body>
    </html>
  `;

  previewWindow.document.write(previewContent);
  previewWindow.document.close();
};