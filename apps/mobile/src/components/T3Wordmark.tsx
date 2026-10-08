import type { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";
import { withUniwind } from "uniwind";

const ThemedPath = withUniwind(Path);

/**
 * The "LH" brand mark, matching the desktop sidebar's T3Wordmark SVG
 * (apps/web Sidebar.tsx). Width derives from the viewBox aspect ratio.
 */
export function T3Wordmark(props: {
  readonly height: number;
  readonly color?: ColorValue;
  readonly colorClassName?: string;
}) {
  const aspectRatio = 92 / 56;
  return (
    <Svg
      accessibilityLabel="Lumin Hub"
      height={props.height}
      width={props.height * aspectRatio}
      viewBox="18 37 92 56"
    >
      <ThemedPath
        d="M18 37H31V80H54V93H18Z M62 37H75V58.5H97V37H110V93H97V71.5H75V93H62Z"
        color={props.color}
        colorClassName={props.colorClassName}
        fill="currentColor"
      />
    </Svg>
  );
}
