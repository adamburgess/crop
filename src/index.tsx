import { batch, ReadonlySignal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { h, render } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import './style.css'

function App() {
    const file = useSignal<File | undefined>(undefined);
    const handleDrop = useCallback((e: DragEvent) => {
        console.log('drop event...');
        e.preventDefault();

        const f = e.dataTransfer?.files?.[0];
        if (f) file.value = f;
    }, []);

    const loadedFile = useSignal<LoadedImage | undefined>(undefined);

    useSignalEffect(() => {
        if (file.value) {
            const loadFile = async function loadFile(f: File) {
                // try and create the image.
                try {
                    const bitmap = await createImageBitmap(f);
                    loadedFile.value = {
                        file: f,
                        height: bitmap.height,
                        width: bitmap.width,
                        url: URL.createObjectURL(f)
                    };
                    bitmap.close();
                } catch (e) {
                    console.log('error creating bitmap from file', e);
                    loadedFile.value = undefined;
                }
            }
            void loadFile(file.value);
        }
    });

    useEffect(() => {
        function pasteEvent(this: Document, e: ClipboardEvent) {
            e.preventDefault();
            const f = e.clipboardData?.files?.[0];
            if (f) file.value = f;
        }
        document.addEventListener('paste', pasteEvent);
        return () => {
            document.removeEventListener('paste', pasteEvent);
        }
    }, []);

    return <div
        class="text-neutral-800 h-full"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
    >
        {loadedFile.value ?
            <DisplayImage key={loadedFile.value.url} {...loadedFile.value} /> :
            <div class="m-2">
                Drop or paste your image here, alright?<br />
                This site helps with ffmpeg's "crop" filter. <br />
                Once an image is placed, draw a box. The filter will be copied to your clipboard.
            </div>
        }
    </div>
}

interface LoadedImage {
    url: string
    file: File
    height: number
    width: number
}

interface Point {
    x: number
    y: number
}

function clamp(val: number, min: number, max: number) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

const defaultBounding = {
    width: 0, height: 0, top: 0, left: 0, display: 'none'
};

function DisplayImage(props: LoadedImage) {
    // ok so we got the file. lets try adding some drag/drop

    const isDown = useSignal(false);

    const start = useSignal<Point>({ x: 0, y: 0 });
    const end = useSignal<Point | undefined>(undefined);

    const mouseDown = useCallback((e: MouseEvent) => {
        batch(() => {
            isDown.value = true;
            start.value = { x: e.pageX, y: e.pageY };
            end.value = undefined;
        });
        console.log('down', e.pageX, e.pageY);
    }, []);
    const mouseMove = useCallback((e: MouseEvent) => {
        if (isDown.value) {
            end.value = { x: e.pageX, y: e.pageY };
        }
    }, []);
    const mouseUp = useCallback((e: MouseEvent) => {
        console.log('up', e.pageX, e.pageY);
        batch(() => {
            end.value = { x: e.pageX, y: e.pageY };
            isDown.value = false;
        });
    }, []);

    const bounding = useComputed(() => {
        const e = end.value;
        const s = start.value;

        if (e === undefined) return defaultBounding;

        const top = clamp(Math.min(s.y, e.y), 0, props.height);
        const bottom = clamp(Math.max(s.y, e.y), 0, props.height);
        const left = clamp(Math.min(s.x, e.x), 0, props.width);
        const right = clamp(Math.max(s.x, e.x), 0, props.width);

        const b = {
            width: right - left,
            height: bottom - top,
            top,
            left
        };

        // ensure width/height are not odd.
        if (b.width % 2 !== 0) b.width++;
        if (b.height % 2 !== 0) b.height++;

        if (b.width === 0 || b.height === 0) return defaultBounding;

        return b;
    });

    const isSet = useComputed(() => {
        return isDown.value === false && bounding.value !== defaultBounding;
    });

    const boundingText = useComputed(() => {
        const b = bounding.value;
        return `${b.width}:${b.height}:${b.left}:${b.top}`
    });

    useSignalEffect(() => {
        if (isSet.value) {
            console.log('set - effect');
            // convert 
            void navigator.clipboard.writeText(`crop=${boundingText.value}`);
        }
    });

    const defaultBoxClass = 'transition-colors duration-75 absolute flex items-center justify-center select-none pointer-events-none opacity-80 ';
    const normalBoxClass = 'bg-blue-600';
    const setBoxClass = 'bg-lime-400';

    return <div class="h-full overflow-hidden relative">
        <div
            class="absolute top-0 left-0 select-none"
            style={{ width: 1920 * 2, height: 1080 * 2 }}
            onMouseDown={mouseDown}
            onMouseMove={mouseMove}
            onMouseUp={mouseUp}>
            <img draggable={false} src={props.url} style={{ imageRendering: 'pixelated' }} />
        </div>
        <div class={defaultBoxClass + (isSet.value ? setBoxClass : normalBoxClass)} style={bounding.value}>
            <div class="text-center font-mono text-xs">
                {boundingText}
            </div>
        </div>
    </div>;
}

render(<App />, document.body);
