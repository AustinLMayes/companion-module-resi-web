// Companion actions:
import type { CompanionActionDefinition, CompanionActionDefinitions, CompanionActionEvent, DropdownChoice, CompanionInputFieldDropdown, CompanionVariableDefinition, CompanionVariableValues } from "@companion-module/base";
import type {ModuleInstance} from './main'

export async function getActions(instance: ModuleInstance): Promise<CompanionActionDefinitions> {
    const actions: CompanionActionDefinitions = {};

    let encoders = await instance.resiApi.getEncoders();
    let encoderProfiles = await instance.resiApi.getEncoderProfiles();
    let eventProfiles = await instance.resiApi.getEventProfiles();

    let encoderChoices = [] as DropdownChoice[];
    for (const [uuid, name] of Object.entries(encoders)) {
        encoderChoices.push({ id: uuid as string, label: name as string});
    }

    let encoderProfileChoices = [] as DropdownChoice[];
    for (const [uuid, name] of Object.entries(encoderProfiles)) {
        encoderProfileChoices.push({ id: uuid, label: name as string });
    }

    let eventProfileChoices = [] as DropdownChoice[];
    for (const [uuid, name] of Object.entries(eventProfiles)) {
        eventProfileChoices.push({ id: uuid, label: name as string });
    }

    actions["start_encoder"] = {
        name: "Start Encoder",
        description: "Start the specified encoder with the specified stream type",
        options: [
            {
                id: "encoder",
                type: "dropdown",
                label: "Encoder to start",
                choices: encoderChoices,
                default: Object.keys(encoders)[0],
            } as CompanionInputFieldDropdown,
            {
                id: "profile",
                type: "dropdown",
                label: "Profile to start",
                choices: encoderProfileChoices,
                default: Object.keys(encoderProfiles)[0],
            } as CompanionInputFieldDropdown,
            {
                id: "event",
                type: "dropdown",
                label: "Event to start",
                choices: eventProfileChoices,
                default: Object.keys(eventProfiles)[0],
            } as CompanionInputFieldDropdown,
        ],
        callback: async (action: CompanionActionEvent) => {
            await instance.resiApi.startEncoder(action.options.encoder, action.options.event, action.options.profile);
            await new Promise(resolve => setTimeout(resolve, 2000));
            instance.checkFeedbacks('encoder_status');            
        }
    } as CompanionActionDefinition;

    actions["stop_encoder"] = {
        name: "Stop Encoder",
        description: "Stop the specified encoder",
        options: [
            {
                id: "encoder",
                type: "dropdown",
                label: "Encoder to stop",
                choices: encoderChoices,
                default: Object.keys(encoders)[0],
            } as CompanionInputFieldDropdown,
        ],
        callback: async (action: CompanionActionEvent) => {
            await instance.resiApi.stopEncoder(action.options.encoder);
            await new Promise(resolve => setTimeout(resolve, 2000));
            instance.checkFeedbacks('encoder_status');
        }
    } as CompanionActionDefinition;

    return actions;
}

