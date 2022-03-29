import React, { ReactNode } from "react";
import "./App.css";
import { Layer, Stage, Circle, Text, Line, Group } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { CircleConfig } from "konva/lib/shapes/Circle";
import { pick } from "lodash";

const CIRCLE_DIAMETER = 11;
const CIRCLE_RADIUS = CIRCLE_DIAMETER / 2;

interface Coords {
  x: number;
  y: number;
}
interface Point extends Coords {
  radius?: number;
  fill?: CircleConfig["fill"];
}
class CirclePoint {
  x: number;
  y: number;
  radius: number = CIRCLE_RADIUS;
  fill: string = "red";

  constructor({ x, y, ...input }: Point) {
    this.x = x;
    this.y = y;
    Object.assign(this, input);
  }
}

const calcLineVector = (
  a: Coords,
  b: Coords | undefined,
  axis: "x" | "y"
): number => {
  if (!b) return 0;

  if (axis === "x") {
    if (a.y > b.y) {
      return a.x < b.x ? b.x - a.x : b.x - a.x;
    } else {
      return a.x > b.x ? b.x - a.x : b.x - a.x;
    }
  } else {
    if (a.x > b.x) {
      return a.y < b.y ? b.y - a.y : b.y - a.y;
    } else {
      return a.y > b.y ? b.y - a.y : b.y - a.y;
    }
  }
};

function App() {
  // 3 points
  const [points, setPoints] = React.useState<CirclePoint[]>([]);
  // 3-4 lines
  const lines: Coords[] = React.useMemo(() => {
    if (points.length === 3) {
      const [a, b, c] = points;
      const d = [a.x - b.x + c.x, a.y - b.y + c.y];
      const extra: Coords = { x: d[0], y: d[1] };

      const _lines: Coords[] = [
        ...points.map((el) => pick(el, ["x", "y"])),
        extra,
      ];
      return _lines;
    } else {
      return points.map((el) => pick(el, ["x", "y"]));
    }
  }, [points]);

  const parallelogramCenter: Coords | null = React.useMemo(() => {
    if (lines.length === 4) {
      return {
        x: (lines[0].x + lines[2].x) / 2,
        y: (lines[0].y + lines[2].y) / 2,
      };
    } else {
      return null;
    }
  }, [lines]);

  const drawParalellogram = () =>
    lines.map((el, i, list) => (
      <Line
        key={[el.x, el.y, i].toString()}
        x={el.x}
        y={el.y}
        stroke="cyan"
        closed
        points={[
          // offset
          0,
          0,
          // x direction
          calcLineVector(el, list[i + 1] ? list[i + 1] : list[0], "x"),
          // y direction
          calcLineVector(el, list[i + 1] ? list[i + 1] : list[0], "y"),
        ]}
      />
    ));

  const drawParalellogramCenter = (): ReactNode | null => {
    if (!parallelogramCenter) return null;
    const [a, b, c] = lines;

    const area = Math.abs(
      (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
    );

    return (
      <Group>
        <Text
          x={parallelogramCenter.x - 20}
          y={parallelogramCenter.y}
          text={area.toString()}
          width={60}
          align="center"
          fill="white"
        ></Text>
        {drawCircle(area)}
      </Group>
    );
  };
  const drawCircle = (area: number) => {
    if (!parallelogramCenter) return null;
    const circleProps: CircleConfig = {
      ...parallelogramCenter,
      radius: Math.sqrt(area / Math.PI),
      stroke: "yellow",
    };
    return <Circle {...circleProps}></Circle>;
  };

  const onClickStage = (event: KonvaEventObject<MouseEvent>) => {
    const { pageX: x, pageY: y } = event.evt;
    const _point = new CirclePoint({ x, y });
    /* limited to 3 */
    const _points = [_point, ...points].splice(0, 3);
    setPoints(_points);
  };

  const onClickReset = () => {
    setPoints([]);
  };

  const updatePoint = (update: Partial<CirclePoint>, index: number) => {
    const _target = points[index];

    setPoints(
      points.map((el, _index) => {
        if (_index === index) {
          return {
            ..._target,
            ...update,
          };
        }
        return el;
      })
    );
  };

  const onDragStartPoint = (
    event: KonvaEventObject<DragEvent>,
    index: number
  ) => {
    event.cancelBubble = true;
    const update: Partial<CirclePoint> = {
      x: event.evt.pageX,
      y: event.evt.pageY,
      radius: CIRCLE_DIAMETER * 2,
    };

    updatePoint(update, index);
  };

  const onDragEndPoint = (
    event: KonvaEventObject<DragEvent>,
    index: number
  ) => {
    const _target = points[index];
    const update: Partial<CirclePoint> = {
      x: event.evt.pageX,
      y: event.evt.pageY,
      radius: CIRCLE_RADIUS,
    };

    setPoints(
      points.map((el, _index) => {
        if (_index === index) {
          return { ..._target, ...update };
        }
        return el;
      })
    );
  };

  const onDragMovePoint = (
    event: KonvaEventObject<DragEvent>,
    index: number
  ) => {
    const update: Partial<CirclePoint> = {
      x: event.evt.pageX,
      y: event.evt.pageY,
      radius: CIRCLE_DIAMETER,
    };
    updatePoint(update, index);
  };

  return (
    <div className="App">
      <button
        onClick={onClickReset}
        style={{ padding: 4, position: "fixed", top: 16, zIndex: 1 }}
      >
        RESET
      </button>
      <Stage
        style={{ zIndex: 0 }}
        width={window.innerWidth}
        height={window.innerHeight}
        onClick={onClickStage}
      >
        <Layer>
          {drawParalellogramCenter()}
          {points.length === 3 && drawParalellogram()}
          {points.map((point, index) => (
            <Group key={index}>
              <Circle
                {...point}
                draggable
                onDragStart={(event) => onDragStartPoint(event, index)}
                onDragEnd={(event) => onDragEndPoint(event, index)}
                onDragMove={(event) => onDragMovePoint(event, index)}
              />
              <Text
                x={point.x - CIRCLE_RADIUS * 4}
                y={point.y - (CIRCLE_RADIUS * 3 + 4)}
                text={[point.x, point.y].join(", ")}
                fill="white"
                width={60}
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
