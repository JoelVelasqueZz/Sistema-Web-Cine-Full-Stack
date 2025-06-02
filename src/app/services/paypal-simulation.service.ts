import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaypalSimulationService {

  constructor() { }

  // ✅ MÉTODO PRINCIPAL - simulatePayPalRedirect
  simulatePayPalRedirect(orderData: any): Promise<PayPalResult> {
    return new Promise((resolve, reject) => {
      console.log('🔄 Redirigiendo a PayPal...');
      
      // Simular ventana de PayPal
      this.openPayPalWindow(orderData).then((result) => {
        if (result.success) {
          resolve({
            success: true,
            transactionId: this.generatePayPalTransactionId(),
            payerId: this.generatePayerId(),
            paymentStatus: 'COMPLETED',
            amount: orderData.total,
            timestamp: new Date().toISOString(),
            method: 'PayPal'
          });
        } else {
          reject({
            success: false,
            error: result.error || 'Pago cancelado por el usuario',
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  // ✅ SIMULAR VENTANA EMERGENTE DE PAYPAL
  private openPayPalWindow(orderData: any): Promise<{success: boolean, error?: string}> {
    return new Promise((resolve) => {
      // Crear contenido HTML simulado de PayPal
      const paypalContent = this.createPayPalWindowContent(orderData);
      
      // Abrir ventana emergente
      const popup = window.open('', 'PayPalPayment', 
        'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (popup) {
        popup.document.write(paypalContent);
        popup.document.close();
        
        // Simular proceso de pago
        this.simulatePaymentProcess(popup, resolve);
      } else {
        resolve({ success: false, error: 'No se pudo abrir la ventana de PayPal' });
      }
    });
  }

  // ✅ CREAR CONTENIDO HTML DE LA VENTANA PAYPAL
  private createPayPalWindowContent(orderData: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>PayPal - Parky Films</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f7f9fc; 
        }
        .paypal-container { 
            max-width: 400px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            padding: 20px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .paypal-header { 
            text-align: center; 
            padding: 20px 0; 
            border-bottom: 1px solid #eee; 
        }
        .paypal-logo { 
            font-size: 2em; 
            color: #003087; 
            font-weight: bold; 
        }
        .payment-details { 
            padding: 20px 0; 
        }
        .amount { 
            font-size: 2em; 
            color: #003087; 
            text-align: center; 
            margin: 20px 0; 
            font-weight: bold; 
        }
        .merchant { 
            text-align: center; 
            color: #666; 
            margin-bottom: 20px; 
        }
        .btn { 
            width: 100%; 
            padding: 15px; 
            border: none; 
            border-radius: 25px; 
            font-size: 1.1em; 
            font-weight: bold; 
            cursor: pointer; 
            margin: 10px 0; 
        }
        .btn-primary { 
            background: #0070ba; 
            color: white; 
        }
        .btn-secondary { 
            background: #eee; 
            color: #333; 
        }
        .btn:hover { 
            opacity: 0.9; 
        }
        .progress { 
            display: none; 
            text-align: center; 
            padding: 20px; 
        }
        .spinner { 
            border: 3px solid #f3f3f3; 
            border-top: 3px solid #0070ba; 
            border-radius: 50%; 
            width: 30px; 
            height: 30px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto; 
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        .security { 
            font-size: 0.8em; 
            color: #666; 
            text-align: center; 
            margin-top: 20px; 
        }
    </style>
</head>
<body>
    <div class="paypal-container">
        <div class="paypal-header">
            <div class="paypal-logo">PayPal</div>
        </div>
        
        <div class="payment-details" id="paymentForm">
            <div class="merchant">
                <strong>Parky Films</strong><br>
                Compra de entradas de cine
            </div>
            
            <div class="amount">$${orderData.total}</div>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Orden:</strong> ${orderData.orderId}<br>
                <strong>Cantidad:</strong> ${orderData.items?.length || 1} entrada(s)<br>
                <strong>Email:</strong> ${orderData.email}
            </div>
            
            <button class="btn btn-primary" onclick="processPayment()">
                💳 Pagar con PayPal
            </button>
            
            <button class="btn btn-secondary" onclick="cancelPayment()">
                ❌ Cancelar
            </button>
            
            <div class="security">
                🔒 Protegido por PayPal<br>
                Tus datos están seguros
            </div>
        </div>
        
        <div class="progress" id="progressSection">
            <div class="spinner"></div>
            <p>Procesando pago con PayPal...</p>
            <p><small>Por favor espera, no cierres esta ventana</small></p>
        </div>
    </div>
    
    <script>
        function processPayment() {
            document.getElementById('paymentForm').style.display = 'none';
            document.getElementById('progressSection').style.display = 'block';
            
            // Simular procesamiento (3 segundos)
            setTimeout(() => {
                // 90% éxito, 10% fallo (para simular realismo)
                const success = Math.random() > 0.1;
                
                if (success) {
                    window.paymentResult = { success: true };
                    alert('✅ Pago exitoso con PayPal!');
                } else {
                    window.paymentResult = { success: false, error: 'Error de conexión con PayPal' };
                    alert('❌ Error en el pago. Intenta nuevamente.');
                }
                
                window.close();
            }, 3000);
        }
        
        function cancelPayment() {
            window.paymentResult = { success: false, error: 'Pago cancelado por el usuario' };
            window.close();
        }
        
        // Detectar cierre de ventana
        window.addEventListener('beforeunload', function() {
            if (!window.paymentResult) {
                window.paymentResult = { success: false, error: 'Ventana cerrada por el usuario' };
            }
        });
    </script>
</body>
</html>`;
  }

  // ✅ SIMULAR PROCESO DE PAGO
  private simulatePaymentProcess(popup: Window, resolve: Function): void {
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        
        // Obtener resultado del pago
        const result = (popup as any).paymentResult || 
          { success: false, error: 'Ventana cerrada inesperadamente' };
        
        resolve(result);
      }
    }, 1000);
    
    // Timeout de seguridad (5 minutos)
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
        clearInterval(checkClosed);
        resolve({ success: false, error: 'Timeout de PayPal' });
      }
    }, 300000);
  }

  // ✅ GENERAR ID DE TRANSACCIÓN REALISTA
  private generatePayPalTransactionId(): string {
    const prefix = 'PAY';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // ✅ GENERAR PAYER ID
  private generatePayerId(): string {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }
}

// ✅ INTERFACE PAYPAL RESULT
export interface PayPalResult {
  success: boolean;
  transactionId?: string;
  payerId?: string;
  paymentStatus?: string;
  amount?: string;
  timestamp?: string;
  method?: string;
  error?: string;
}