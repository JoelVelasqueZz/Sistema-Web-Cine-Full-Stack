import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BarService {

  private productosBar: ProductoBar[] = [
    // === BEBIDAS ===
    {
      id: 1,
      nombre: "Coca-Cola Grande",
      descripcion: "Refresco de cola de 32oz, perfecto para acompañar tu película favorita",
      precio: 4.50,
      categoria: "Bebidas",
      imagen: "assets/bar/coca-cola-grande.png",
      disponible: true,
      esCombo: false,
      tamanos: [
        { nombre: "Mediana (24oz)", precio: 3.50 },
        { nombre: "Grande (32oz)", precio: 4.50 },
        { nombre: "Extra Grande (44oz)", precio: 5.50 }
      ]
    },
    {
      id: 2,
      nombre: "Sprite Grande",
      descripcion: "Refresco de lima-limón refrescante de 32oz",
      precio: 4.50,
      categoria: "Bebidas",
      imagen: "assets/bar/sprite-grande.png",
      disponible: true,
      esCombo: false,
      tamanos: [
        { nombre: "Mediana (24oz)", precio: 3.50 },
        { nombre: "Grande (32oz)", precio: 4.50 },
        { nombre: "Extra Grande (44oz)", precio: 5.50 }
      ]
    },
    {
      id: 3,
      nombre: "Agua Embotellada",
      descripcion: "Agua purificada en botella de 500ml",
      precio: 2.50,
      categoria: "Bebidas",
      imagen: "assets/bar/agua.png",
      disponible: true,
      esCombo: false
    },
    {
      id: 4,
      nombre: "Café Premium",
      descripcion: "Café recién molido, disponible en diferentes tamaños",
      precio: 3.00,
      categoria: "Bebidas",
      imagen: "assets/bar/cafe.png",
      disponible: true,
      esCombo: false,
      tamanos: [
        { nombre: "Pequeño (8oz)", precio: 3.00 },
        { nombre: "Mediano (12oz)", precio: 4.00 },
        { nombre: "Grande (16oz)", precio: 5.00 }
      ]
    },
    {
      id: 5,
      nombre: "Jugo de Naranja",
      descripcion: "Jugo natural de naranja, sin conservantes artificiales",
      precio: 4.00,
      categoria: "Bebidas",
      imagen: "assets/bar/jugo-naranja.png",
      disponible: true,
      esCombo: false
    },

    // === SNACKS ===
    {
      id: 6,
      nombre: "Palomitas Clásicas",
      descripcion: "Palomitas recién hechas con mantequilla y sal, el snack perfecto para el cine",
      precio: 6.00,
      categoria: "Snacks",
      imagen: "assets/bar/palomitas-clasicas.png",
      disponible: true,
      esCombo: false,
      tamanos: [
        { nombre: "Pequeñas", precio: 4.50 },
        { nombre: "Medianas", precio: 6.00 },
        { nombre: "Grandes", precio: 7.50 },
        { nombre: "Jumbo", precio: 9.00 }
      ]
    },
    {
      id: 7,
      nombre: "Palomitas Dulces",
      descripcion: "Palomitas caramelizadas con un toque dulce irresistible",
      precio: 6.50,
      categoria: "Snacks",
      imagen: "assets/bar/palomitas-dulces.png",
      disponible: true,
      esCombo: false,
      tamanos: [
        { nombre: "Pequeñas", precio: 5.00 },
        { nombre: "Medianas", precio: 6.50 },
        { nombre: "Grandes", precio: 8.00 }
      ]
    },
    {
      id: 8,
      nombre: "Nachos con Queso",
      descripcion: "Crujientes nachos servidos con queso cheddar derretido",
      precio: 7.00,
      categoria: "Snacks",
      imagen: "assets/bar/nachos.png",
      disponible: true,
      esCombo: false,
      extras: [
        { nombre: "Guacamole", precio: 1.50 },
        { nombre: "Jalapeños", precio: 1.00 },
        { nombre: "Salsa picante", precio: 0.50 }
      ]
    },
    {
      id: 9,
      nombre: "Hot Dog Clásico",
      descripcion: "Salchicha premium en pan tostado con mostaza y ketchup",
      precio: 5.50,
      categoria: "Snacks",
      imagen: "assets/bar/hotdog.png",
      disponible: true,
      esCombo: false,
      extras: [
        { nombre: "Queso derretido", precio: 1.00 },
        { nombre: "Cebolla caramelizada", precio: 1.00 },
        { nombre: "Chili", precio: 1.50 }
      ]
    },
    {
      id: 10,
      nombre: "Pretzel Gigante",
      descripcion: "Pretzel horneado caliente con sal gruesa, incluye mostaza",
      precio: 4.50,
      categoria: "Snacks",
      imagen: "assets/bar/pretzel.png",
      disponible: true,
      esCombo: false
    },

    // === DULCES ===
    {
      id: 11,
      nombre: "M&M's",
      descripcion: "Clásicos chocolates con cubierta de colores",
      precio: 3.50,
      categoria: "Dulces",
      imagen: "assets/bar/mms.png",
      disponible: true,
      esCombo: false,
      tamanos: [
        { nombre: "Bolsa pequeña", precio: 3.50 },
        { nombre: "Bolsa grande", precio: 5.00 }
      ]
    },
    {
      id: 12,
      nombre: "Skittles",
      descripcion: "Dulces frutales en una explosión de sabores",
      precio: 3.50,
      categoria: "Dulces",
      imagen: "assets/bar/skittles.png",
      disponible: true,
      esCombo: false
    },
    {
      id: 13,
      nombre: "Kit Kat",
      descripcion: "Barrita de chocolate crujiente, perfecta para compartir",
      precio: 2.50,
      categoria: "Dulces",
      imagen: "assets/bar/kitkat.png",
      disponible: true,
      esCombo: false
    },
    {
      id: 14,
      nombre: "Sour Patch Kids",
      descripcion: "Dulces agridulces con forma de niños traviesos",
      precio: 4.00,
      categoria: "Dulces",
      imagen: "assets/bar/sour-patch.png",
      disponible: true,
      esCombo: false
    },
    {
      id: 15,
      nombre: "Twizzlers",
      descripcion: "Regaliz rojo en tiras, clásico dulce americano",
      precio: 3.75,
      categoria: "Dulces",
      imagen: "assets/bar/twizzlers.png",
      disponible: true,
      esCombo: false
    },

    // === COMBOS ESPECIALES ===
    {
      id: 16,
      nombre: "Combo Clásico",
      descripcion: "Palomitas medianas + Bebida grande + Dulce a elegir",
      precio: 12.00,
      categoria: "Combos",
      imagen: "assets/bar/combo-clasico.png",
      disponible: true,
      esCombo: true,
      descuento: 2.50,
      incluye: [
        "Palomitas medianas",
        "Bebida grande (a elegir)",
        "Dulce pequeño (a elegir)"
      ]
    },
    {
      id: 17,
      nombre: "Combo Familiar",
      descripcion: "Palomitas jumbo + 2 Bebidas grandes + 2 Dulces",
      precio: 22.00,
      categoria: "Combos",
      imagen: "assets/bar/combo-familiar.png",
      disponible: true,
      esCombo: true,
      descuento: 5.00,
      incluye: [
        "Palomitas jumbo",
        "2 Bebidas grandes (a elegir)",
        "2 Dulces (a elegir)"
      ]
    },
    {
      id: 18,
      nombre: "Combo Premium",
      descripcion: "Nachos + Hot Dog + Bebida grande + Postre",
      precio: 18.50,
      categoria: "Combos",
      imagen: "assets/bar/combo-premium.png",
      disponible: true,
      esCombo: true,
      descuento: 3.00,
      incluye: [
        "Nachos con queso",
        "Hot Dog clásico",
        "Bebida grande (a elegir)",
        "Kit Kat"
      ]
    },
    {
      id: 19,
      nombre: "Combo Estudiante",
      descripcion: "Palomitas pequeñas + Bebida mediana + Dulce",
      precio: 9.50,
      categoria: "Combos",
      imagen: "assets/bar/combo-estudiante.png",
      disponible: true,
      esCombo: true,
      descuento: 1.50,
      incluye: [
        "Palomitas pequeñas",
        "Bebida mediana (a elegir)",
        "Dulce pequeño (a elegir)"
      ]
    },

    // === PRODUCTOS ESPECIALES ===
    {
      id: 20,
      nombre: "Helado de Vainilla",
      descripcion: "Copa de helado cremoso de vainilla con topping a elegir",
      precio: 5.50,
      categoria: "Helados",
      imagen: "assets/bar/helado-vainilla.png",
      disponible: true,
      esCombo: false,
      extras: [
        { nombre: "Chispas de chocolate", precio: 0.50 },
        { nombre: "Caramelo", precio: 0.75 },
        { nombre: "Fresa", precio: 0.75 }
      ]
    }
  ];

  private categoriasDisponibles: string[] = [
    'Todas',
    'Bebidas', 
    'Snacks', 
    'Dulces', 
    'Combos', 
    'Helados'
  ];

  constructor() {
    console.log('Servicio del bar inicializado!');
    this.loadProductosFromStorage();
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  /**
   * Obtener todos los productos del bar
   */
  getProductos(): ProductoBar[] {
    return this.productosBar;
  }

  /**
   * Obtener producto específico por ID
   */
  getProducto(id: number): ProductoBar | null {
    return this.productosBar.find(producto => producto.id === id) || null;
  }

  /**
   * Obtener productos por categoría
   */
  getProductosPorCategoria(categoria: string): ProductoBar[] {
    if (categoria === 'Todas') {
      return this.productosBar;
    }
    return this.productosBar.filter(producto => 
      producto.categoria.toLowerCase() === categoria.toLowerCase()
    );
  }

  /**
   * Obtener categorías disponibles
   */
  getCategorias(): string[] {
    return this.categoriasDisponibles;
  }

  /**
   * Buscar productos por nombre
   */
  buscarProductos(termino: string): ProductoBar[] {
    if (!termino.trim()) {
      return this.productosBar;
    }

    termino = termino.toLowerCase().trim();
    
    return this.productosBar.filter(producto => 
      producto.nombre.toLowerCase().includes(termino) ||
      producto.descripcion.toLowerCase().includes(termino) ||
      producto.categoria.toLowerCase().includes(termino)
    );
  }

  /**
   * Filtrar productos disponibles
   */
  getProductosDisponibles(): ProductoBar[] {
    return this.productosBar.filter(producto => producto.disponible);
  }

  /**
   * Obtener productos destacados (combos y más populares)
   */
  getProductosDestacados(): ProductoBar[] {
    return this.productosBar.filter(producto => 
      producto.esCombo || 
      producto.categoria === 'Snacks' ||
      producto.id === 1 || producto.id === 6 // Coca-Cola y Palomitas
    ).slice(0, 6);
  }

  /**
   * Contar productos por categoría
   */
  contarProductosPorCategoria(categoria: string): number {
    if (categoria === 'Todas') {
      return this.productosBar.length;
    }
    return this.productosBar.filter(p => 
      p.categoria.toLowerCase() === categoria.toLowerCase()
    ).length;
  }

  // ==================== MÉTODOS DE ADMINISTRACIÓN ====================

  /**
   * Agregar nuevo producto (solo admin)
   */
  addProducto(producto: Omit<ProductoBar, 'id'>): boolean {
    try {
      // Validar datos requeridos
      if (!producto.nombre || !producto.descripcion || !producto.categoria) {
        console.error('Faltan datos requeridos para crear el producto');
        return false;
      }

      // Generar nuevo ID
      const nuevoId = Math.max(...this.productosBar.map(p => p.id)) + 1;

      const nuevoProducto: ProductoBar = {
        ...producto,
        id: nuevoId,
        imagen: producto.imagen || 'assets/bar/default.png'
      };

      // Agregar al array
      this.productosBar.push(nuevoProducto);
      
      // Guardar en localStorage
      this.saveProductosToStorage();
      
      console.log('Producto agregado exitosamente:', nuevoProducto.nombre);
      return true;
      
    } catch (error) {
      console.error('Error al agregar producto:', error);
      return false;
    }
  }

  /**
   * Actualizar producto existente (solo admin)
   */
  updateProducto(id: number, productoData: Partial<ProductoBar>): boolean {
    try {
      const index = this.productosBar.findIndex(p => p.id === id);
      
      if (index === -1) {
        console.error('Producto no encontrado');
        return false;
      }

      // Actualizar producto
      this.productosBar[index] = {
        ...this.productosBar[index],
        ...productoData,
        id: id // Mantener el ID original
      };

      // Guardar cambios
      this.saveProductosToStorage();
      
      console.log('Producto actualizado exitosamente:', this.productosBar[index].nombre);
      return true;
      
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      return false;
    }
  }

  /**
   * Eliminar producto (solo admin)
   */
  deleteProducto(id: number): boolean {
    try {
      const index = this.productosBar.findIndex(p => p.id === id);
      
      if (index === -1) {
        console.error('Producto no encontrado');
        return false;
      }

      const productoEliminado = this.productosBar[index];
      
      // Eliminar producto del array
      this.productosBar.splice(index, 1);
      
      // Guardar cambios
      this.saveProductosToStorage();
      
      console.log('Producto eliminado exitosamente:', productoEliminado.nombre);
      return true;
      
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      return false;
    }
  }

  /**
   * Cambiar disponibilidad de producto (solo admin)
   */
  toggleDisponibilidad(id: number): boolean {
    try {
      const producto = this.productosBar.find(p => p.id === id);
      
      if (!producto) {
        console.error('Producto no encontrado');
        return false;
      }

      producto.disponible = !producto.disponible;
      
      // Guardar cambios
      this.saveProductosToStorage();
      
      console.log(`Producto ${producto.nombre} ${producto.disponible ? 'habilitado' : 'deshabilitado'}`);
      return true;
      
    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error);
      return false;
    }
  }

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  /**
   * Validar datos de producto
   */
  validateProductoData(producto: Partial<ProductoBar>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones requeridas
    if (!producto.nombre?.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!producto.descripcion?.trim()) {
      errors.push('La descripción es requerida');
    }

    if (!producto.categoria?.trim()) {
      errors.push('La categoría es requerida');
    }

    if (!producto.precio || producto.precio <= 0) {
      errors.push('El precio debe ser mayor a 0');
    }

    // Validar que la categoría sea válida
    if (producto.categoria && !this.categoriasDisponibles.includes(producto.categoria)) {
      errors.push('La categoría seleccionada no es válida');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ==================== MÉTODOS DE PERSISTENCIA ====================

  /**
   * Guardar productos en localStorage
   */
  private saveProductosToStorage(): void {
    try {
      localStorage.setItem('parky_productos_bar', JSON.stringify(this.productosBar));
    } catch (error) {
      console.error('Error al guardar productos del bar en localStorage:', error);
    }
  }

  /**
   * Cargar productos desde localStorage
   */
  private loadProductosFromStorage(): void {
    try {
      const savedProductos = localStorage.getItem('parky_productos_bar');
      if (savedProductos) {
        const productos = JSON.parse(savedProductos);
        if (productos.length > 0) {
          this.productosBar = productos;
          console.log('Productos del bar cargados desde localStorage:', productos.length);
        }
      }
    } catch (error) {
      console.error('Error al cargar productos del bar desde localStorage:', error);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Calcular precio con descuento para combos
   */
  calcularPrecioConDescuento(producto: ProductoBar): number {
    if (producto.esCombo && producto.descuento) {
      return producto.precio - producto.descuento;
    }
    return producto.precio;
  }

  /**
   * Obtener productos más populares
   */
  getProductosPopulares(): ProductoBar[] {
    // Simulamos popularidad basada en categoría y si es combo
    return this.productosBar
      .filter(p => p.disponible)
      .sort((a, b) => {
        if (a.esCombo && !b.esCombo) return -1;
        if (!a.esCombo && b.esCombo) return 1;
        return 0;
      })
      .slice(0, 8);
  }

  /**
   * Verificar si un producto tiene opciones (tamaños o extras)
   */
  tieneOpciones(producto: ProductoBar): boolean {
    return !!(producto.tamanos?.length || producto.extras?.length);
  }
}

// ==================== INTERFACES ====================

export interface ProductoBar {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  disponible: boolean;
  esCombo: boolean;
  tamanos?: TamañoProducto[];  // Cambiar de tamaños a tamanos
  extras?: ExtraProducto[];
  incluye?: string[]; // Para combos
  descuento?: number; // Para combos
}

export interface TamañoProducto {
  nombre: string;
  precio: number;
}

export interface ExtraProducto {
  nombre: string;
  precio: number;
}

export interface ProductoCarrito {
  producto: ProductoBar;
  cantidad: number;
  tamañoSeleccionado?: TamañoProducto;
  extrasSeleccionados?: ExtraProducto[];
  precioTotal: number;
  notas?: string;
}