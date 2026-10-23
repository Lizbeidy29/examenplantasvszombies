
"use strict";

// ==========================================
// PUEBLO DE NOCHE DE BRUJAS
// 10 plantas + 15 enemigos + sonido
// ==========================================

const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");
const marcador = document.getElementById("puntaje");
const carpeta = "assets/";

// Imágenes
const fondo = new Image();
fondo.src = carpeta + "fondo patio.jpg";

const mazo = new Image();
mazo.src = carpeta + "mazo.png";

// AUDIO: comprueba que este nombre coincida
// exactamente con el archivo dentro de assets.
const musica = new Audio(carpeta + "musica.mpeg");
musica.loop = true;
musica.volume = 0.25;
musica.preload = "auto";
const sonidoGolpe = new Audio(
    "assets/andressamd-pop-click-576326.mp3"
);
sonidoGolpe.volume = 0.7;
sonidoGolpe.preload = "auto";
sonidoGolpe.volume = 0.7;
sonidoGolpe.preload = "auto";

let musicaIniciada = false;
let ancho = window.innerWidth;
let alto = window.innerHeight;
let puntos = 0;

const figuras = [];
const particulas = [];

const cursor = {
    x: ancho / 2,
    y: alto / 2,
    golpe: 0
};

// ==========================================
// SONIDO
// ==========================================

function iniciarMusica() {
    if (musicaIniciada) return;

    musica.play()
        .then(() => {
            musicaIniciada = true;
            console.log("Música de fondo reproduciéndose.");
        })
        .catch(error => {
            console.error(
                "No se pudo reproducir la música. Comprueba el archivo y su formato:",
                error
            );
        });
}

musica.addEventListener("error", () => {
    console.error("Error al cargar assets/musica.mpeg");
});

sonidoGolpe.addEventListener("error", () => {
    console.error("Error al cargar assets/golpe.mp3");
});

// ==========================================
// AJUSTAR CANVAS
// ==========================================

function ajustarCanvas() {
    const escala = window.devicePixelRatio || 1;

    ancho = window.innerWidth;
    alto = window.innerHeight;

    canvas.width = Math.round(ancho * escala);
    canvas.height = Math.round(alto * escala);

    ctx.setTransform(escala, 0, 0, escala, 0, 0);
}

window.addEventListener("resize", ajustarCanvas);

// ==========================================
// CARGAR IMÁGENES
// ==========================================

function cargarImagen(nombre) {
    const imagen = new Image();
    imagen.src = carpeta + nombre;

    imagen.onerror = () => {
        console.error("No se encontró la imagen:", carpeta + nombre);
    };

    return imagen;
}

// ==========================================
// CREAR FIGURAS
// ==========================================

function crearFigura(tipo, numero, indice) {
    const imagen = cargarImagen(`${tipo} ${numero}.png`);
    const radio = tipo === "planta" ? 45 : 48;

    const f = {
        tipo,
        numero,
        imagen,
        radio,

        x: radio + Math.random() * Math.max(1, ancho - radio * 2),
        y: radio + Math.random() * Math.max(1, alto - radio * 2),

        vx: (Math.random() < 0.5 ? -1 : 1) *
            (1.2 + Math.random() * 1.5),

        vy: (Math.random() < 0.5 ? -1 : 1) *
            (1.2 + Math.random() * 1.5),

        // 0 horizontal, 1 vertical, 2 diagonal, 3 circular
        movimiento: indice % 4,

        angulo: Math.random() * Math.PI * 2,
        velocidadAngular: 0.012 + Math.random() * 0.015,

        centroX: 0,
        centroY: 0,
        amplitudX: 35 + Math.random() * 50,
        amplitudY: 30 + Math.random() * 40,
        rebote: 0
    };

    f.centroX = f.x;
    f.centroY = f.y;

    return f;
}

function iniciarJuego() {
    figuras.length = 0;

    for (let i = 1; i <= 10; i++) {
        figuras.push(crearFigura("planta", i, i - 1));
    }

    for (let i = 1; i <= 15; i++) {
        figuras.push(crearFigura("enemigo", i, i + 9));
    }

    console.log("Total de figuras:", figuras.length);
}

// ==========================================
// MOVIMIENTO Y REBOTES
// ==========================================

function limitar(valor, minimo, maximo) {
    if (maximo < minimo) return (minimo + maximo) / 2;
    return Math.max(minimo, Math.min(maximo, valor));
}

function moverFigura(f) {
    if (f.movimiento === 0) {
        f.x += f.vx;
    } else if (f.movimiento === 1) {
        f.y += f.vy;
    } else if (f.movimiento === 2) {
        f.x += f.vx;
        f.y += f.vy;
    } else {
        f.angulo += f.velocidadAngular;

        f.centroX = limitar(
            f.centroX,
            f.radio + f.amplitudX,
            ancho - f.radio - f.amplitudX
        );

        f.centroY = limitar(
            f.centroY,
            f.radio + f.amplitudY,
            alto - f.radio - f.amplitudY
        );

        f.x = f.centroX + Math.cos(f.angulo) * f.amplitudX;
        f.y = f.centroY + Math.sin(f.angulo) * f.amplitudY;
    }

    if (f.movimiento !== 1 && f.movimiento !== 3) {
        if (f.x < f.radio || f.x > ancho - f.radio) {
            f.vx *= -1;
            f.x = limitar(f.x, f.radio, ancho - f.radio);
            f.rebote = 8;
            crearChispas(f.x, f.y, 4);
        }
    }

    if (f.movimiento !== 0 && f.movimiento !== 3) {
        if (f.y < f.radio || f.y > alto - f.radio) {
            f.vy *= -1;
            f.y = limitar(f.y, f.radio, alto - f.radio);
            f.rebote = 8;
            crearChispas(f.x, f.y, 4);
        }
    }

    if (f.rebote > 0) f.rebote--;
}

// ==========================================
// COLISIONES ENTRE PERSONAJES
// ==========================================

function detectarColisiones() {
    for (let i = 0; i < figuras.length; i++) {
        const a = figuras[i];

        for (let j = i + 1; j < figuras.length; j++) {
            const b = figuras[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distancia = Math.hypot(dx, dy);
            const minimo = a.radio + b.radio;

            if (distancia < minimo && distancia > 0) {
                const nx = dx / distancia;
                const ny = dy / distancia;
                const separacion = (minimo - distancia) / 2;

                a.x -= nx * separacion;
                a.y -= ny * separacion;
                b.x += nx * separacion;
                b.y += ny * separacion;

                const temporalX = a.vx;
                const temporalY = a.vy;

                a.vx = b.vx;
                a.vy = b.vy;
                b.vx = temporalX;
                b.vy = temporalY;

                a.rebote = 8;
                b.rebote = 8;

                crearChispas(
                    (a.x + b.x) / 2,
                    (a.y + b.y) / 2,
                    6
                );
            }
        }
    }
}

// ==========================================
// CHISPAS Y EFECTOS
// ==========================================

function crearChispas(x, y, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        particulas.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,
            vida: 25,
            tamano: 2 + Math.random() * 4
        });
    }
}

function dibujarChispas() {
    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vida--;

        ctx.globalAlpha = Math.max(0, p.vida / 25);
        ctx.fillStyle = "#ffb52e";

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.tamano, 0, Math.PI * 2);
        ctx.fill();

        if (p.vida <= 0) {
            particulas.splice(i, 1);
        }
    }

    ctx.globalAlpha = 1;
}

// ==========================================
// DIBUJAR PERSONAJES
// ==========================================

function dibujarFigura(f) {
    ctx.save();
    ctx.translate(f.x, f.y);

    if (f.rebote > 0) ctx.scale(1.08, 0.92);

    const tamano = f.radio * 2;

    if (f.imagen.complete && f.imagen.naturalWidth > 0) {
        ctx.drawImage(
            f.imagen,
            -f.radio,
            -f.radio,
            tamano,
            tamano
        );
    } else {
        ctx.font = "48px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.tipo === "planta" ? "🎃" : "🧟", 0, 0);
    }

    ctx.restore();
}

// ==========================================
// MARTILLO
// ==========================================

function dibujarMartillo() {
    ctx.save();
    ctx.translate(cursor.x, cursor.y);
    ctx.rotate(cursor.golpe > 0 ? -1 : -0.45);

    if (mazo.complete && mazo.naturalWidth > 0) {
        ctx.drawImage(mazo, -25, -25, 75, 75);
    } else {
        ctx.strokeStyle = "#713d20";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(18, 36);
        ctx.stroke();

        ctx.fillStyle = "#b8bdc9";
        ctx.strokeStyle = "#49394f";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(-17, -14, 39, 24, 5);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();

    if (cursor.golpe > 0) cursor.golpe--;
}

// ==========================================
// GOLPEAR FIGURAS
// ==========================================

function golpear(x, y) {
    cursor.golpe = 10;

    let objetivo = null;
    let distanciaMenor = Infinity;

    for (const f of figuras) {
        const distancia = Math.hypot(x - f.x, y - f.y);

        if (distancia <= f.radio + 12 && distancia < distanciaMenor) {
            objetivo = f;
            distanciaMenor = distancia;
        }
    }

    if (!objetivo) return false;

    puntos++;
    marcador.textContent = puntos;

    crearChispas(objetivo.x, objetivo.y, 20);

    // Reaparece en otro lugar: se conservan las 25 figuras
    objetivo.x = objetivo.radio +
        Math.random() * Math.max(1, ancho - objetivo.radio * 2);

    objetivo.y = objetivo.radio +
        Math.random() * Math.max(1, alto - objetivo.radio * 2);

    objetivo.centroX = objetivo.x;
    objetivo.centroY = objetivo.y;
    objetivo.angulo = Math.random() * Math.PI * 2;
    objetivo.vx *= -1;
    objetivo.vy *= -1;
    objetivo.rebote = 10;

    return true;
}

// ==========================================
// EVENTOS DEL RATÓN Y SONIDOS
// ==========================================

canvas.addEventListener("mousemove", evento => {
    cursor.x = evento.clientX;
    cursor.y = evento.clientY;
});

canvas.addEventListener("click", evento => {
    // Iniciar la música con el primer clic permitido
    iniciarMusica();

    const acertado = golpear(evento.clientX, evento.clientY);

    // Reproducir el golpe solo si se acierta a una figura
    if (acertado) {
        sonidoGolpe.currentTime = 0;

        sonidoGolpe.play().catch(error => {
            console.error("No se pudo reproducir golpe.mp3:", error);
        });
    }
});

// ==========================================
// DIBUJAR EL JUEGO
// ==========================================

function animar() {
    ctx.clearRect(0, 0, ancho, alto);

    if (fondo.complete && fondo.naturalWidth > 0) {
        ctx.drawImage(fondo, 0, 0, ancho, alto);
    } else {
        ctx.fillStyle = "#180e25";
        ctx.fillRect(0, 0, ancho, alto);
    }

    figuras.forEach(moverFigura);
    detectarColisiones();
    figuras.forEach(dibujarFigura);

    dibujarChispas();
    dibujarMartillo();

    requestAnimationFrame(animar);
}

// ==========================================
// INICIAR
// ==========================================

ajustarCanvas();
iniciarJuego();
animar();