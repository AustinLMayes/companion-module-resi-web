import type {CompanionFeedbackDefinitions, CompanionFeedbackDefinition, CompanionInputFieldDropdown, CompanionFeedbackBooleanEvent, CompanionFeedbackContext, DropdownChoice, CompanionFeedbackButtonStyleResult} from '@companion-module/base'
import type {ModuleInstance} from './main'

export async function getFeedbacks(instance: ModuleInstance): Promise<CompanionFeedbackDefinitions> {
    const feedbacks: CompanionFeedbackDefinitions = {}

    let encoders = await instance.resiApi.getEncoders(); // hash of encoder uuids to names
    let encoderOptions: DropdownChoice[] = [];
    for (const [uuid, name] of Object.entries(encoders)) {
        encoderOptions.push({ id: uuid, label: name as string });
    }

    let intervalId: NodeJS.Timeout | null = null;

    feedbacks['encoder_status'] = {
        name: 'Encoder Status',
        type: 'boolean',
        description: 'Feedback when an encoder changes status',
        defaultStyle: {
            bgcolor: 0xff0000,
            color: 0xffffff,
        } as CompanionFeedbackButtonStyleResult,
        options: [
            {
                type: 'dropdown',
                id: 'encoder',
                label: 'Encoder',
                choices: encoderOptions,
                default: Object.keys(encoders)[0],
            } as CompanionInputFieldDropdown,
        ],
        callback: async (feedback: CompanionFeedbackBooleanEvent, context: CompanionFeedbackContext) => {
            const encoderStatus = await instance.resiApi.getEncoderStatusById(feedback.options.encoder);
            return encoderStatus.status === 'started';
        },
        subscribe: async (feedback: CompanionFeedbackBooleanEvent, context: CompanionFeedbackContext) => {
            if (intervalId !== null) {
                // already subscribed
                return;
            }
            intervalId = setInterval(async () => {
                const encoderStatus = await instance.resiApi.getEncoderStatusById(feedback.options.encoder);
                instance.checkFeedbacks('encoder_status')
            }, 5000);
        }, unsubscribe: async (feedback: CompanionFeedbackBooleanEvent, context: CompanionFeedbackContext) => {
            if (intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    } as CompanionFeedbackDefinition

    feedbacks['encoder_has_video'] = {
        name: 'Encoder Has Video',
        type: 'boolean',
        description: 'Feedback when an encoder has video',
        defaultStyle: {
            bgcolor: 0x00ff00,
            color: 0xffffff,
        } as CompanionFeedbackButtonStyleResult,
        options: [
            {
                type: 'dropdown',
                id: 'encoder',
                label: 'Encoder',
                choices: encoderOptions,
                default: Object.keys(encoders)[0],
            } as CompanionInputFieldDropdown,
        ],
        callback: async (feedback: CompanionFeedbackBooleanEvent, context: CompanionFeedbackContext) => {
            const encoderStatus = await instance.resiApi.getEncoderStatusById(feedback.options.encoder);
            return encoderStatus.videoInputSource !== null;
        },
        subscribe: async (feedback: CompanionFeedbackBooleanEvent, context: CompanionFeedbackContext) => {
            if (intervalId !== null) {
                // already subscribed
                return;
            }
            intervalId = setInterval(async () => {
                const encoderStatus = await instance.resiApi.getEncoderStatusById(feedback.options.encoder);
                instance.checkFeedbacks('encoder_has_video')
            }, 5000);
        }, unsubscribe: async (feedback: CompanionFeedbackBooleanEvent, context: CompanionFeedbackContext) => {
            if (intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    } as CompanionFeedbackDefinition

    return feedbacks
}