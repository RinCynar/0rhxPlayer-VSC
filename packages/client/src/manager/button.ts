import { CONTEXT, MultiStepInput } from "../utils/index.js";
import type { QueueContent } from "../treeview/index.js";
import { StatusBarAlignment, window } from "vscode";
import { BUTTON_KEY } from "../constant/index.js";
import type { StatusBarItem } from "vscode";
import i18n from "../i18n/index.js";
import { randomUUID } from "node:crypto";

const enum Label {
  seekbackward,
  previous,
  play,
  next,
  seekforward,
  repeat,
  speed,
  volume,
  song,
  lyric,
}

interface MyStatusBarItem extends StatusBarItem {
  command: string;
}

class ButtonManager {
  readonly #defaultText = <const>[
    "$(triangle-left)",
    "$(chevron-left)",
    "$(play)",
    "$(chevron-right)",
    "$(triangle-right)",
    "$(sync-ignored)",
    "$(dashboard)",
    "$(unmute)",
    "$(flame)",
    "$(text-size)",
  ];

  readonly #defaultTooltip = <const>[
    i18n.word.seekbackward,
    i18n.word.previousTrack,
    i18n.word.play,
    i18n.word.nextTrack,
    i18n.word.seekforward,
    i18n.word.repeat,
    i18n.word.speed,
    i18n.word.volume,
    i18n.word.song,
    i18n.word.lyric,
  ];

  readonly #defaultCommand = <const>[
    "0rhxplayer.seekbackward",
    "0rhxplayer.previous",
    "0rhxplayer.toggle",
    "0rhxplayer.next",
    "0rhxplayer.seekforward",
    "0rhxplayer.repeat",
    "0rhxplayer.speed",
    "0rhxplayer.volume",
    "",
    "0rhxplayer.lyric",
  ];

  readonly #buttons = [
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -128),
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -129),
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -130),
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -131),
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -132),
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -133),
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -134),
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -135),
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -136),
    <MyStatusBarItem>window.createStatusBarItem(randomUUID(), StatusBarAlignment.Left, -137),
  ];

  #buttonShow = <boolean[]>Array(10).fill(true);

  constructor() {
    this.#defaultText.forEach((value, index) => (this.#buttons[index].text = value));

    this.#defaultTooltip.forEach((value, index) => (this.#buttons[index].tooltip = value));

    this.#defaultCommand.forEach((value, index) => (this.#buttons[index].command = value));

    // Hide the lyric area until a synchronized lyric is available.
    this.#buttons[Label.lyric].hide();
  }

  init(): void {
    this.#buttonShow = CONTEXT.context.globalState.get(BUTTON_KEY, this.#buttonShow);
    this.#buttonShow.forEach((v, i: Label) => {
      if (i === Label.song) this.#buttons[i].show();
      else v ? this.#buttons[i].show() : this.#buttons[i].hide();
    });
  }

  toggle(): void {
    void MultiStepInput.run(async (input) => {
      const { i } = await input.showQuickPick({
        title: "",
        step: 1,
        totalSteps: 1,
        items: this.#defaultText.map((text, i: Label) => ({
          label: `${text} ${this.#defaultTooltip[i]}`,
          description: this.#buttonShow[i] ? i18n.word.show : i18n.word.hide,
          i,
        })),
        placeholder: i18n.sentence.hint.button,
      });

      const show = (this.#buttonShow[i] = !this.#buttonShow[i]);
      if (i === Label.song) {
        if (show) this.#buttons[Label.song].text = "$(flame)";
      } else show ? this.#buttons[i].show() : this.#buttons[i].hide();

      await CONTEXT.context.globalState.update(BUTTON_KEY, this.#buttonShow);
      return input.stay();
    });
  }

  buttonPrevious(): void {
    this.#buttons[Label.previous].text = "$(chevron-left)";
    this.#buttons[Label.previous].tooltip = i18n.word.previousTrack;
    this.#buttons[Label.previous].command = "0rhxplayer.previous";
  }

  buttonPlay(playing: boolean): void {
    this.#buttons[Label.play].text = playing ? "$(debug-pause)" : "$(play)";
    this.#buttons[Label.play].tooltip = playing ? i18n.word.pause : i18n.word.play;
  }

  buttonRepeat(r: boolean): void {
    this.#buttons[Label.repeat].text = r ? "$(sync)" : "$(sync-ignored)";
  }

  buttonVolume(level: number): void {
    this.#buttons[Label.volume].tooltip = `${i18n.word.volume}: ${level}`;
  }

  buttonSpeed(speed: number): void {
    this.#buttons[Label.speed].tooltip = `${i18n.word.speed}: ${speed}`;
  }

  /** Show only the song title. */
  buttonSong(ele?: QueueContent | string): void {
    if (!ele || typeof ele === "string") {
      this.#buttons[Label.song].text = ele || "$(flame)";
      this.#buttons[Label.song].tooltip = "";
    } else {
      const item = ele.data;
      this.#buttons[Label.song].text = item.name;
      this.#buttons[Label.song].tooltip = item.name;
    }
  }

  /** Show a single line of the original lyric, or hide the area when absent. */
  buttonLyric(text?: string): void {
    const btn = this.#buttons[Label.lyric];
    if (text) {
      btn.show();
      btn.text = text;
    } else btn.hide();
  }
}

export const BUTTON_MANAGER = new ButtonManager();
