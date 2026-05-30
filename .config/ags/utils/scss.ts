import { exec } from "ags/process";
import { monitorFile } from "ags/file";
import App from "ags/gtk4/app";
import { globalSettings } from "../variables";
import GLib from "gi://GLib";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const tmpDir = `/tmp/ags-${GLib.get_user_name()}`;
const tmpCss = `${tmpDir}/tmp-style.css`;
const tmpScss = `${tmpDir}/tmp-style.scss`;
const scssDir = `${GLib.get_home_dir()}/.config/ags/scss`;

const walScssColors = `${GLib.get_home_dir()}/.cache/cwal/colors.scss`;
const walCssColors = `${GLib.get_home_dir()}/.cache/cwal/colors.css`;
const defaultColors = `${scssDir}/defaultColors.scss`;

export const getCssPath = () => {
  refreshCss();
  return tmpCss;
};

function tryReadFile(path: string): string {
  const [ok, contents] = GLib.file_get_contents(path);
  return ok ? decoder.decode(contents) : "";
}

export function refreshCss() {
  exec(`mkdir -p ${tmpDir}`);

  const opacity = Number(globalSettings.peek().ui.opacity.value).toFixed(2);
  const fontSize = globalSettings.peek().ui.fontSize.value;
  const scale = globalSettings.peek().ui.scale.value;

  let content = [
    `$OPACITY: ${opacity};`,
    `$FONT-SIZE: ${fontSize}px;`,
    `$SCALE: ${scale}px;`,
    "",
    tryReadFile(defaultColors),
    tryReadFile(walScssColors),
    tryReadFile(walCssColors),
    tryReadFile(`${scssDir}/style.scss`),
  ].join("\n");

  GLib.file_set_contents(tmpScss, encoder.encode(content));

  exec(
    `sass --style=compressed --silence-deprecation=import --silence-deprecation=global-builtin --silence-deprecation=function-units --silence-deprecation=slash-div ${tmpScss} ${tmpCss} -I ${scssDir}`,
  );

  App.reset_css();
  App.apply_css(tmpCss);
}

monitorFile(
  `${scssDir}`,
  () => refreshCss(),
);

monitorFile(
  // directory that contains pywal colors
  `${GLib.get_home_dir()}/.cache/cwal/colors.scss`,
  () => refreshCss(),
);
