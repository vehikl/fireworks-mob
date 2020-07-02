import { render, c } from 'declarativas';

class Particle {
    static GRAVITY = 0.0001;

    constructor({ x, y, vx, vy, type }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.hue = Math.random() * 360
        this.type = type;
        this.size = 5;
    }

    static firework() {
        return new Particle({
            x: Math.floor(Math.random() * canvas.width),
            y: canvas.height - 20,
            vy: 0.2 + (Math.random() / 3.5),
            vx: 0,
            type: 'firework'
        });
    }

    static explosion(firework) {
        const angle = Math.random() * 360;

        return new Particle({
            x: firework.x,
            y: firework.y,
            vy: Math.sin(angle * Math.PI / 180) * (Math.random() / 8),
            vx: Math.cos(angle * Math.PI / 180) * (Math.random() / 8),
            type: 'explosion'
        });
    }

    update(delta) {
        this.vy -= (Particle.GRAVITY * delta);
        this.vx /= 1.001;
        this.y -= (this.vy * delta);
        this.x += (this.vx * delta);
        this.size = Math.max(0.5, this.size - (0.0005 * delta));
    }

    explode() {
        return Array.from({ length: 200 }, () => Particle.explosion(this));
    }
}

const canvas = document.querySelector('canvas');

const resizeCanvas = () =>  {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

function* generateState(initialState) {
    let state = {
        ...initialState
    };

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            state.particles.push(Particle.firework());
        }
    });

    let last = null;

    while(true) {
        const now = performance.now();
        const delta = last ? now - last : 0;
        last = now;
        state.particles = state.particles
            .reduce((particles, particle) => {
                particle.update(delta);
                let explosions = [];

                if (particle.vy <= 0 && particle.type === 'firework') {
                    particle.type = '';
                    explosions = particle.explode();
                }

                if (particle.x < 0 || particle.x > canvas.width && particle.y < 0 || particle.y > canvas.height) {
                    return [
                        ...particles,
                        ...explosions,
                    ];

                }

                return [
                    ...particles,
                    particle,
                    ...explosions,
                ];
            }, []);
        if (state.particles.length === 0) {
            state.particles = Array.from(
                { length: 5 + Math.floor(Math.random() * 5) },
                () => Particle.firework()
            );
        }
        yield state;
    }
}

const draw = (currentState) => {
    const { value: state } = currentState.next();
    render(canvas.getContext('2d'), [
        c('fillStyle', { value: state.background }),
        c('fillRect', {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
        }),

        state.particles.map(particle => [
            c('fillStyle', { value: `hsl(${particle.hue}, 50%, 50%)` }),
            c(
            'fillRect',
            {
                x: particle.x,
                y: particle.y,
                width: particle.size,
                height: particle.size,
            })
        ])
        ,
    ]);

    requestAnimationFrame(() => draw(currentState));
}

resizeCanvas();
const backgroundColor = canvas.getContext('2d').createLinearGradient(0, 0, 0, canvas.height);
backgroundColor.addColorStop(0, "#05054A");
backgroundColor.addColorStop(0.6, "#191970");
backgroundColor.addColorStop(1, "#9999E3");

draw(generateState({
    background: backgroundColor,
    particles: Array.from(
        { length: 10 },
        () => Particle.firework()
    )
}));
