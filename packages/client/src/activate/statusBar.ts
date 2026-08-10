import { IPC, MultiStepInput, STATE } from "../utils/index.js";
import { BUTTON_MANAGER } from "../manager/index.js";
import type { ExtensionContext } from "vscode";
import type { InputStep } from "../utils/index.js";
import { commands } from "vscode";
import i18n from "../i18n/index.js";

export function initStatusBar(context: ExtensionContext): void {
  BUTTON_MANAGER.init();

  context.subscriptions.push(
    commands.registerCommand("0rhxplayer.lyric", async () => {
      const totalSteps = 2;
      const title = i18n.word.lyric;

      const enum Type {
        delay,
        disable,
      }

      await MultiStepInput.run(async (input) => {
        const { type } = await input.showQuickPick({
          title,
          step: 1,
          totalSteps,
          items: [
            {
              label: `$(versions) ${i18n.word.lyricDelay}`,
              description: `${i18n.sentence.label.lyricDelay} (${i18n.word.default}: -1.0)`,
              type: Type.delay,
            },
            {
              label: STATE.showLyric
                ? `$(circle-slash) ${i18n.word.disable}`
                : `$(circle-large-outline) ${i18n.word.enable}`,
              type: Type.disable,
            },
          ],
        });
        switch (type) {
          case Type.delay:
            return (input) => inputDelay(input);
          case Type.disable:
            STATE.showLyric = !STATE.showLyric;
            break;
        }
        return input.stay();
      });

      async function inputDelay(input: MultiStepInput): Promise<InputStep> {
        const delay = await input.showInputBox({ title, step: 2, totalSteps, prompt: i18n.sentence.hint.lyricDelay });
        if (/^-?[0-9]+([.]{1}[0-9]+){0,1}$/.test(delay)) IPC.lyricDelay(parseFloat(delay));
        return input.stay();
      }
    }),
  );
}
