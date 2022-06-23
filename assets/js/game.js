class Game {
    /**
     * C'tor
     * @param {Int} targetFrameRate Target frame rate per second.
     * @param {Int} targetFixedUpdateRate Target fixed updates per second.
     */
    constructor(targetFrameRate, targetFixedUpdateRate) {
        this.fps = 0;
        this.canvas = document.getElementById("gameWindow");
        this.canvas.width = document.body.clientWidth - 30;
        this.canvas.height = 900;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.context = this.canvas.getContext('2d');
        this.lastUpdate = 0;
        this.lastFixedUpdate = 0;
        this.lastFrame = 0;

        this.targetFixedUpdate = 1 / targetFixedUpdateRate;
        this.targetFixedUpdateMS = 1000 / targetFixedUpdateRate;
        this.targetFrameRate = 1 / targetFrameRate;
        this.targetFrameRateMS = 1000 / targetFrameRate;

        this.gameObjects = [];

        // Get the right update method.
        this.updateMethod = Game.GetUpdateMethod();
        // Handle rescaling
        new ResizeObserver(this.onWindowResize.bind(this)).observe(document.body);
        // this.startLoop();
        window.addEventListener('keydown', this.input.bind(this), false);
        this.startLoop();
    }

    startLoop() {
        isPlaying = true;
        let now = performance.now();
        this.lastUpdate = now;
        this.lastFixedUpdate = now - this.targetFixedUpdateMS;
        this.lastFrame = now - this.targetFrameRateMS;
        console.log(this);
        this.updateMethod(this.gameLoop.bind(this));
    }

    gameLoop() {
        if (isPlaying === true) {
            this.updateMethod(this.gameLoop.bind(this));
        }
        const now = performance.now();
        const delta = (now - this.lastUpdate)/1000;
        const fixedDelta = (now - this.lastFixedUpdate)/1000; 
        const frameDelta = (now - this.lastFrame)/1000;
        this.lastUpdate = now;
        
        // While loop so we can catch up if neccesary(?)
        // Using an if statement speeds up gameplay if necessary, but gives a smoother catchup experience.
        if (fixedDelta >= this.targetFixedUpdate)
        {
            // Actual fixedUpdate
            let diff = (now - this.lastFixedUpdate) / 1000;
            //console.log("diff: ",diff, "FixedUpdate:", this.targetFixedUpdate);

            // In a ideal world there is no delay, but that's obviously not the case.
            // Subtract the delay to make the next event fire ever so slightly faster.
            this.lastFixedUpdate = now - (now - this.lastFixedUpdate - this.targetFixedUpdateMS);
            // Lets just tell the method 
            this.fixedUpdate(diff, now);
        }

        // Update
        this.update(delta, now);

        // The refresh rate is less important, we can be less accurate here.
        if (frameDelta >= this.targetFrameRate)
        {
            this.lastFrame = now - (now - this.lastFrame - this.targetFrameRateMS);
            this.render();
        }
    }

    onWindowResize() {
        // Handle resize logic here
        //console.log(document.body.clientWidth, document.body.clientHeight);
        this.gameObjects.forEach(gameObject => {
            gameObject.onCanvasResize(this.width, this.height);
        })
    }

    update(deltaTime, now) {
        this.gameObjects.forEach(gameObject => {
            gameObject.update(deltaTime, now);
        });
    }

    fixedUpdate(fixedDeltaTime, now) {
        this.gameObjects.forEach(gameObject => {
            gameObject.fixedUpdate(fixedDeltaTime, now);
        });
    }

    render() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gameObjects.forEach(gameObject => {
            gameObject.render(this.context);
        });
    }

    input(i) {
        let keyCode = i.keyCode;
        switch (keyCode) {
            case 27: // 'ESC'ape
            case 80: // 'P'
                isPlaying = !isPlaying;
                console.log("Is Playing = ", isPlaying);
                if (isPlaying === true) {
                    this.startLoop();
                }
                break;
        
            default:
                console.log(keyCode);
                break;
        }
    }

    addGameobject(newGameObject) {
        this.gameObjects.push(newGameObject);
        newGameObject.onCanvasResize(this.width, this.height);
    }

    static GetUpdateMethod() {
        return window.requestAnimationFrame.bind(window) || 
            window.webkitRequestAnimationFrame.bind(window) || 
            window.mozRequestAnimationFrame.bind(window) || 
            window.oRequestAnimationFrame.bind(window) || 
            window.msRequestAnimationFrame.bind(window) || 
            function(callback, element){
                window.setTimeout(function(){
                    callback();
                }, 1000 / 60); // Timeout callback ~60fps / ~16.666ms update
            }.bind(window);
    }
}

class FPSCounter
{
    constructor(game) {
        this.x = 10;
        this.y = 10;
        this.fps = 0;

        // Manually calculate rendered frames
        this.lastSecond = performance.now();
        this.targetFrameRate = Math.round(1 / game.targetFrameRate);
        this.ticks = 0;
        this.renderedFramesPerSecond = 0;
    }

    update(deltaTime, now) {
        this.fps = 1/deltaTime;
     }
    
    fixedUpdate(fixedDeltaTime, now) { }

    render(ctx) {
        this.ticks++;
        if (this.ticks >= this.targetFrameRate) {
            let now = performance.now();
            // Calculate the fps by counting the frames dividing it by the time passed in seconds
            this.renderedFramesPerSecond = (this.ticks / ((now-this.lastSecond)/1000)).toFixed(2);
            this.lastSecond = now;
            this.ticks = 0;
        }

        ctx.fillText(this.fps.toFixed(2) + " Update rate", this.x, this.y);
        ctx.fillText(this.renderedFramesPerSecond + " Frame rate", this.x, this.y + 10);
    }

    onCanvasResize(width, height) {}
}

class Terrain
{
    static MinWaveWidth = 175;
    static MaxWaveWidth = 300;
    static MinWaveHeight = 100;
    static MaxWaveHeight = 200;
    constructor() {
        this.x = 0;
        this.y = 150;
        this.length = Math.PI*2;
        this.step = 1;
        this.canvasWidth = 0;
        this.canvasHeight = 0;

        this.waves = [];
        this.furthestX = 0;
    }

    update(deltaTime, now) {}
    fixedUpdate(fixedDeltaTime, now){}
    render(ctx) {
        if (this.hasSave) {
            ctx.restore();
            return;
        }
        ctx.beginPath();
        ctx.moveTo(0, this.canvasHeight);
        for (let i = 0; i < this.waves.length; i++) {
            const element = this.waves[i];
            const isCurve = element.y0 !== element.y1;
            if (isCurve) {
                for (let x = element.x0; x < element.x1; x++) {
                    ctx.lineTo(x, MathExtension.Lerp(element.y0, element.y1, MathExtension.SmoothStep(element.x0, element.x1, x)));
                }
            }
            else {
                ctx.lineTo(element.x1, element.y1);
            }
        }
        ctx.lineTo(this.canvasWidth, this.canvasHeight);
        ctx.fill();
    }

    onCanvasResize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.expandWaves();
    }

    expandWaves() {
        let index = this.waves.length;
        if (index === 0) {
            this.waves.push({
                previous: null,
                next: null,
                x0: 0,
                y0: this.canvasHeight - 200,
                x1: Terrain.MinWaveWidth,
                y1: this.canvasHeight - Terrain.MinWaveHeight,
            });
            index++;
        }
        while (this.furthestX < this.canvasWidth) {
            const prevElement = this.waves[this.waves.length -1];
            const isCurve = (prevElement.y0 === prevElement.y1);
            let waveLine = {};
            if (isCurve) {
                const earlierElement = this.waves[this.waves.length -2];
                const isHill = earlierElement.y0 < earlierElement.y1;
                waveLine = Terrain.CurveLine(prevElement, isHill);
                // this.waves.push(waveLine);
                // waveLine = Terrain.Mirror(waveLine);
            } else {
                waveLine = Terrain.StraightLine(prevElement);
            }
            if (waveLine.y1 > this.canvasHeight) waveLine.y1 = this.canvasHeight;
            prevElement.next = waveLine;
            waveLine.previous = prevElement;
            this.waves.push(waveLine);
            this.furthestX = waveLine.x1;
            index++;
        }
    }

    /**
     * Gets the wave which contains worldspace x.
     * @param {float} x the worldspace x of the object.
     * @returns the wave which contains the provided worlspace x.
     */
    getWaveAtPosition(x) {
        for (let i = 0; i < this.waves.length; i++) {
            const element = this.waves[i];
            if (x < element.x1) return element;
        }
    }

    /**
     * Calculates the waveheight by dividing the wave into 5 slices and performing line-line intersection logic on them.
     * @param {*} position position of the object.
     * @param {*} predictedPosition direction of the object.
     * @param {*} wave the wave from which we should start calculating
     */
    static getWaveIntersection(position, predictedPosition, wave) {
        const searchRight = (position.x < predictedPosition.x);
        let currentWave = wave;
        while (currentWave !== null) {
            const waveResult = Terrain.waveIntersection(position, predictedPosition, wave);
            if (waveResult.intersect) {
                return { ...waveResult, wave: currentWave }; // Include the correct wave.
            }
            
            // Continue looking into the direction of the predicted line position
            if (searchRight) {
                currentWave = currentWave.next;
                if (currentWave !== null && predictedPosition.x < currentWave.x0) return waveResult;
            } else {
                currentWave = currentWave.previous;
                if (currentWave !== null && predictedPosition.x > currentWave.x1) return waveResult;
            }
        }
        return { intersect: false };
    }

    static waveIntersection(position, predictedDirection, wave) {
        const waveSegments = Terrain.SubdivideWave(wave);
        for (let i = 0; i < waveSegments.length -1; i++) {
            const element = waveSegments[i];
            const intersection = MathExtension.LineIntersection(position, predictedDirection, element, waveSegments[i+1]);
            
            if (intersection.intersect === true) {
                return intersection;
            }
        }
        return { intersect: false };
    }

    /**
     * Subdivides the wave into 5 pieces.
     * @param {*} wave the wave to subdivide
     */
    static SubdivideWave(wave) {
        const wavePoints = [];
        // 0,  1,2,3,4,5, 6,
        for (let index = 0; index < 6; index++) {
            // const element = array[index];
            let x = MathExtension.Lerp(wave.x0, wave.x1, (index / (6 - 1)));
            // wavePoints
            wavePoints.push({
                x, 
                y: MathExtension.Lerp(wave.y0, wave.y1, MathExtension.SmoothStep(wave.x0, wave.x1, x)) 
            });
        }
        return wavePoints;
    }

    static getWaveHeightAtPosition(x, wave) {
        while (x > wave.x1 && wave.next !== null) wave = wave.next;
        while (x < wave.x0 && wave.previous !== null) wave = wave.previous;
        return MathExtension.Lerp(wave.y0, wave.y1, MathExtension.SmoothStep(wave.x0, wave.x1, x));
    }

    static StraightLine(prevLine) {
        let x = prevLine.x1;
        let y = prevLine.y1;
        return {previous: null, next: null, x0: x, y0: y, x1: x + 5, y1: y};
    }

    static CurveLine(prevCurve, isHill) {
        const x0 = prevCurve.x1;
        const x1 = x0 + MathExtension.Lerp(Terrain.MinWaveWidth, Terrain.MaxWaveWidth, Math.random());
        const y0 = prevCurve.y1;
        let y1 = (isHill) 
            ? y0 - MathExtension.Lerp(Terrain.MinWaveHeight, Terrain.MaxWaveHeight, Math.random())
            : y0 + MathExtension.Lerp(Terrain.MinWaveHeight, Terrain.MaxWaveHeight, Math.random());
        return {previous: null, next: null, x0, y0, x1, y1};
    }

    static Mirror(prevCurve) { return { x0: prevCurve.x1, y0: prevCurve.y1, x1: prevCurve.x1 + prevCurve.x1 - prevCurve.x0, y1: prevCurve.y0 }; }
}

class MathExtension {
    static Lerp(p0, p1, t) { return p0 + (p1 - p0) * t; }

    static LerpBetween(x1, x2, t, min, max) { return MathExtension.TryClamp(MathExtension.Lerp(x1, x2, t), min, max); }

    static Unlerp(p0, p1, t) { return (t - p0) / (p1 - p0); }

    static TryClamp(num, min, max) {
        let isClamped = false;
        let distanceOverExtended = 0;
        if (num < min) {
            isClamped = true;
            distanceOverExtended = min - num;
            num = min;
        }
        if (num > max) {
            isClamped = true;
            distanceOverExtended = num - max;
            num = max;
        }
        return { isClamped, result: num, extrapolatedDistance: distanceOverExtended };
    }

    static Clamp (num, min, max) { return Math.min(Math.max(num, min), max); }

    static SmoothStep(p0, p1, t)
    {
        if (t < p0) return 0;
        if (t >= p1) return 1;
        const x = (t - p0) / (p1 - p0);
        return x * x * (3 - 2 * x);
    }

    static DotProduct(x0, y0, x1, y1) { return (x0 * x1 + y0 * y1); }

    static SurfaceNormal(surfaceDir) {
        if (surfaceDir.x < 0)
            return {x: -surfaceDir.y, y: surfaceDir.x};
        return {x: surfaceDir.y, y: -surfaceDir.x};
    }

    static Reflect(inDir, surfaceNormal) {
        const d = MathExtension.DotProduct(inDir.x, inDir.y, surfaceNormal.x, surfaceNormal.y);
        const factor = -2 * d;
        return {x: factor * surfaceNormal.x + inDir.x,
                y: factor * surfaceNormal.y + inDir.y};
    }

    static Magnitude(vec) { return Math.sqrt(vec.x * vec.x + vec.y * vec.y); }

    static Normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        return { x:(x / length), y:(y / length) };
    }

    static LineIntersection(p0, p1, p2, p3) {
        const s1_x = p1.x - p0.x;
        const s1_y = p1.y - p0.y;
        const s2_x = p3.x - p2.x;
        const s2_y = p3.y - p2.y;
        const s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
        const t = ( s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) { 
            // Collision detected
            const x = p0.x + (t * s1_x);
            const y = p0.y + (t * s1_y);
            return { intersect:true, position: {x,y}};
        } 
        return { intersect:false, position: {} }; // No collision 
    }
}

class Player {
    constructor(terrain) {
        // Last fixed update positions
        this.x = 300;
        this.y = 10;
        // Interpolation
        this.ix = this.x;
        this.iy = this.y;
        // Interpolation limits
        this.iMaxX = terrain.canvasWidth;
        this.iMaxY = 999999;
        this.iMinX = 0;
        this.iMinY = -100;

        // Predicted location before the next fixedUpdate
        this.predictedX = 0;
        this.predictedY = 0;
        this.predictedFloorHeight = 0;
        this.collisionPoint = null;
        this.floorSlopeDir = null;
        this.floorNormal = null;

        // Velocity
        this.velocity = { x:0, y:0 };
        this.terrain = terrain;
        this.isGrounded = false;

        this.lastFixedUpdate = 0;
        this.predictedNextFixedUpdate = 0;
        this.fixedDeltaTime = 0;

        // this.floor
        window.addEventListener('keydown', this.input.bind(this), false);
    }

    update(deltaTime, now) {
        // Get the time between previous and now
        let t = MathExtension.Unlerp(this.lastFixedUpdate, this.predictedNextFixedUpdate, now);
        
        // Interpolate between previous fixed update and the next one
        // Note: do not use predictedX/Y since these will be changed soon.
        let lerpX = MathExtension.LerpBetween(this.x, this.x + this.velocity.x * this.fixedDeltaTime, t, this.iMinX, this.iMaxX);
        let lerpY = MathExtension.LerpBetween(this.y, this.y + this.velocity.y * this.fixedDeltaTime, t, this.iMinY, this.iMaxY);
        // If the value was clamped it means we've hit something, and should get the next direction/velocity.
        if (lerpX.isClamped || lerpY.isClamped) {
            // TODO: check if there is a next redirection available.
            // console.log(lerpX.extrapolatedDistance, lerpY.extrapolatedDistance);
            // Use the overextended distance to displace the object in the new direction
            // 
        }
        this.ix = lerpX.result;
        this.iy = lerpY.result;
    }
    
    fixedUpdate(fixedDeltaTime, now) {
        // FixedUpdate might get called a update later, which could slow down/stutter the velocity if we say t = 1.
        
        // console.log("Last: ", this.lastFixedUpdate, " Predicted: ", this.predictedNextFixedUpdate, " Actual:", now);
        this.lastFixedUpdate = now;
        this.predictedNextFixedUpdate = this.lastFixedUpdate + fixedDeltaTime * 1000;
        this.fixedDeltaTime = fixedDeltaTime;

        
        // Apply drag
        this.velocity.x -= this.velocity.x * 0.1 / (1/this.fixedDeltaTime);
        this.velocity.y -= this.velocity.y * 0.1 / (1/this.fixedDeltaTime);

        // If the player is in the air
        if (this.iy + 5 < this.predictedFloorHeight) {
            this.isGrounded = false;
            console.log("In air!");
            this.velocity.y += 9.81 * 100 * fixedDeltaTime;
            // this.velocity.x += 9.81 * 30 * fixedDeltaTime;
        // 900 < 1000
        // } 
        // // Barely called, usually skipped
        // else if (this.iy < this.predictedFloorHeight) {
        //     // Glide over the floor?
        //     this.isGrounded = true;
        } else {
            // console.log("Grounded!");
            this.isGrounded = true;
            this.iy = this.predictedFloorHeight;
            this.y = this.predictedFloorHeight;

            // if (Math.abs(this.velocity.y) <= 20)
            //     this.velocity.y = 0;
            // else
                this.velocity.y *= -0.9;
        }

        // Corner bounce
        // if (this.ix >= this.iMaxX || this.ix <= this.iMinX) {
        //     this.velocity.x *= -0.8;
        // }

        // Prepare interpolation
        this.x = this.ix;
        this.y = this.iy;
        // console.log("Current x: ", this.x," y: ", this.y, "Expected/Predicted x: ", this.predictedX, " y: ", this.predictedY);
        this.predictedX = this.x + this.velocity.x * fixedDeltaTime;
        this.predictedY = this.y + this.velocity.y * fixedDeltaTime;
        // this.collisionPoint

        // Get wave at current position
        const waveBelow = this.terrain.getWaveAtPosition(this.x);

        this.waveIntersectionResult = Terrain.getWaveIntersection(
            {x: this.x, y: this.y}, 
            {x: this.predictedX, y: this.predictedY},
            waveBelow);

        console.log(this.waveIntersectionResult);
        this.waveBelow = waveBelow;

        //TODO: update this logic below to be accurate
        
        // Calculate the height of the floor, and it's slope
        this.predictedFloorHeight = Terrain.getWaveHeightAtPosition(this.predictedX, waveBelow);
        const horizontalDirection = (this.velocity.x >= 0) ? 1 : -1;
        const nextPredictedFloor = Terrain.getWaveHeightAtPosition(this.predictedX + horizontalDirection, waveBelow);
        
        this.iMaxY = this.predictedFloorHeight;
        this.floorSlopeDir = MathExtension.Normalize(horizontalDirection, nextPredictedFloor - this.predictedFloorHeight);
        this.floorNormal = MathExtension.SurfaceNormal(this.floorSlopeDir);
        this.floorReflectionDir = MathExtension.Reflect(MathExtension.Normalize(this.velocity.x, this.velocity.y), this.floorNormal);
        
        // For testing only.
        this.mouseDirection = MathExtension.Normalize(this.predictedX - mousePosition.x, this.predictedFloorHeight - mousePosition.y);
    }

    render(ctx) {
        this.canvas = ctx;
        const defaultColor = "black"
        const playerColor = "purple";
        // Draw player
        ctx.beginPath();
        ctx.arc(this.ix, this.iy, 10, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.fill();

        if (Debug)
        {
            // Variables
            const lineLength = 100;
            const surfaceRightColor = "red";
            const surfaceUpColor = "yellow"; 
            const reflectionDirColor = "blue";
            const mouseColor = "green";
            ctx.lineWidth = 5;
            
            // Draw direction + velocity
            ctx.beginPath();
            ctx.strokeStyle = surfaceRightColor;
            ctx.moveTo(this.ix, this.iy);
            ctx.lineTo(this.predictedX, this.predictedY);
            ctx.stroke();
            
            // Draw ghost
            ctx.beginPath();
            ctx.arc(this.predictedX, this.predictedY, 10, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(123, 123, 123, 0.7)";
            // ctx.fillStyle = playerColor;
            ctx.fill();

            // Draw terrain right
            ctx.beginPath();
            ctx.moveTo(this.predictedX, this.predictedFloorHeight);
            ctx.lineTo(this.predictedX + this.floorSlopeDir.x * lineLength, this.predictedFloorHeight + this.floorSlopeDir.y * lineLength);
            ctx.stroke();

            // Draw surfacenormal
            ctx.beginPath();
            ctx.strokeStyle = surfaceUpColor;
            ctx.moveTo(this.predictedX, this.predictedFloorHeight);
            ctx.lineTo(this.predictedX + this.floorNormal.x * lineLength, this.predictedFloorHeight + this.floorNormal.y * lineLength);
            ctx.stroke();

            // Draw reflection
            ctx.beginPath();
            ctx.strokeStyle = reflectionDirColor;
            ctx.moveTo(this.predictedX, this.predictedFloorHeight);
            ctx.lineTo(this.predictedX + this.floorReflectionDir.x * lineLength, this.predictedFloorHeight + this.floorReflectionDir.y * lineLength);
            ctx.stroke();

            // Draw wave
            let waveSegments = Terrain.SubdivideWave(this.waveBelow);
            ctx.beginPath();
            ctx.strokeStyle = "green";
            ctx.lineWidth = 3;
            ctx.moveTo(waveSegments[0].x, waveSegments[0].y);
            for (let index = 1; index < waveSegments.length; index++) {
                const element = waveSegments[index];
                ctx.lineTo(element.x, element.y);
            }
            ctx.stroke();

            // Draw intersection (if there is any)
            if (this.waveIntersectionResult.intersect) {
                ctx.beginPath();
                ctx.strokeStyle = "red";
                ctx.moveTo(this.waveIntersectionResult.position.x, this.waveIntersectionResult.position.y);
                ctx.lineTo(this.waveIntersectionResult.position.x + 100, this.waveIntersectionResult.position.y);
                ctx.stroke();
            }

            // Draw path to mouse:
            // ctx.beginPath();
            // ctx.strokeStyle = mouseColor;
            // ctx.moveTo(this.predictedX - this.mouseDirection.x * 50, this.predictedFloorHeight - this.mouseDirection.y * 50);
            // ctx.lineTo(this.predictedX, this.predictedFloorHeight);
            // ctx.stroke();
        }
        ctx.strokeStyle = defaultColor;
        ctx.fillStyle = defaultColor;
        ctx.lineWidth = 1;
    }

    onCanvasResize(width, height) {}

    input(key) {
        const keyCode = key.keyCode;
        switch(keyCode) {
            case 83: // 'S' pressed
                this.velocity.y = 2;
                break;
            case 68: // 'D' pressed
                this.velocity.x += 100;
                break;

            case 37: // Left pressed
                break;
            case 38: // Up pressed
                break
            case 39: // Right pressed
                break;
            case 40: // Down pressed
                break;
        }
    }
}

let mousePosition = {x:0, y:0};
function getMousePos(e) {
    let canvas = document.getElementById("gameWindow");
    var rect = canvas.getBoundingClientRect();
    mousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startGame() {
    const game = new Game(144, 5);
    const terrain = new Terrain();
    game.addGameobject(new FPSCounter(game));
    game.addGameobject(terrain);
    game.addGameobject(new Player(terrain));
    
    onmousemove = getMousePos;
}
const Debug = true;
let isPlaying = true;
startGame();