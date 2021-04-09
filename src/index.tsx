import { h, render, Fragment } from 'preact';
import 'preact/devtools';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import './global.css'

function App() {
    const [file, setFile] = useState<File | undefined>(undefined);
    const handleDrop = (e: DragEvent) => {
        console.log('drop event...');
        e.preventDefault();

        const f = e.dataTransfer?.files?.[0];
        if (f) setFile(f);
    };

    const [imageMeta, setImageMeta] = useState({ height: 460, width: 460 });

    useEffect(() => {
        if (file) {
            const loadFile = async function loadFile(f: File) {
                // try and create the image.
                try {
                    const bitmap = await createImageBitmap(f);
                    setImageMeta({
                        height: bitmap.height,
                        width: bitmap.width
                    });
                    bitmap.close();
                } catch (e) {
                    console.log('error creating bitmap from file', e);
                    setImageMeta({
                        height: 0,
                        width: 0
                    });
                }
            }
            void loadFile(file);
        }
    }, [file]);

    useEffect(() => {
        function pasteEvent(this: Document, e: ClipboardEvent) {
            e.preventDefault();
            const f = e.clipboardData?.files?.[0];
            if (f) setFile(f);
        }
        document.addEventListener('paste', pasteEvent);
        return () => {
            document.removeEventListener('paste', pasteEvent);
        }
    }, []);

    const fileUrl = useMemo(() => {
        if (file && imageMeta.width !== 0) {
            return URL.createObjectURL(file);
        }
    }, [file, imageMeta]);

    return <div
        class="text-gray-800 h-full"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
    >
        {fileUrl ?
            <DisplayImage fileUrl={fileUrl} width={imageMeta.width} height={imageMeta.height} /> :
            <div class="m-2">
                Drop or paste your image here, alright?<br />
                This site helps with ffmpeg's "crop" filter. <br />
                Once an image is placed, draw a box. The filter will be copied to your clipboard.
            </div>
        }
    </div>
}

interface DisplayImageProps {
    fileUrl: string
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

function DisplayImage(props: DisplayImageProps) {
    // ok so we got the file. lets try adding some drag/drop

    const [isDown, setIsDown] = useState(false);

    const [start, setStart] = useState<Point>({ x: 0, y: 0 });
    const [end, setEnd] = useState<Point | undefined>(undefined);

    useEffect(() => {
        setEnd(undefined);
    }, [props.fileUrl]);

    const mouseDown = (e: MouseEvent) => {
        setIsDown(true);
        setStart({ x: e.pageX, y: e.pageY });
        setEnd(undefined);
        console.log('down', e.pageX, e.pageY);
    }
    const mouseMove = useCallback((e: MouseEvent) => {
        if (isDown) {
            setEnd({ x: e.pageX, y: e.pageY });
        }
    }, [isDown]);
    const mouseUp = (e: MouseEvent) => {
        console.log('up', e.pageX, e.pageY);
        setEnd({ x: e.pageX, y: e.pageY });
        setIsDown(false);
    };

    const bounding = useMemo(() => {
        if (end === undefined) return defaultBounding;

        const top = clamp(Math.min(start.y, end.y), 0, props.height);
        const bottom = clamp(Math.max(start.y, end.y), 0, props.height);
        const left = clamp(Math.min(start.x, end.x), 0, props.width);
        const right = clamp(Math.max(start.x, end.x), 0, props.width);

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
    }, [start, end]);

    const isSet = useMemo(() => {
        return isDown === false && bounding !== defaultBounding;
    }, [isDown, bounding]);

    useEffect(() => {
        if (isSet) {
            console.log('set - effect');
            // convert 
            void navigator.clipboard.writeText(`crop=${bounding.width}:${bounding.height}:${bounding.top}:${bounding.left}`);
        }
    }, [isSet]);

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
            <img draggable={false} src={props.fileUrl} style={{ imageRendering: 'pixelated' }} />
        </div>
        <div class={defaultBoxClass + (isSet ? setBoxClass : normalBoxClass)} style={bounding}>
            <div class="text-center font-mono text-xs">
                {bounding.width}:{bounding.height}:{bounding.top}:{bounding.left}
            </div>
        </div>
    </div>;
}

render(<App />, document.body);
