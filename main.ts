import { InstanceBase, runEntrypoint, InstanceStatus, type CompanionVariableDefinition, type CompanionVariableValues, type CompanionActionDefinition, type CompanionActionDefinitions, type CompanionFeedbackDefinitions, type OSCSomeArguments, type OSCMetaArgument, type OSCArgument } from '@companion-module/base'
import { Regex, type SomeCompanionConfigField } from '@companion-module/base'
import { ResiApi } from './resi_api.js'
import { getActions } from './actions.js'
import { getFeedbacks } from './feedbacks.js'

export class ModuleInstance extends InstanceBase<any> {
	
	resiApi: any;
	
	constructor(internal: any) {
		super(internal)
		this.log('debug', 'ok')
	}

	async init(config: any) {
		if (config && config.username && config.password) {
			await this.createAPI(config)
		} else
			this.updateStatus(InstanceStatus.BadConfig, 'No username or password')
			
	}
	
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config: any) {
		await this.createAPI(config)
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return [
			{
				type: 'textinput',
				id: 'username',
				label: 'Resi Username',
				tooltip: 'Email address used to login to Resi',
				width: 6,
				regex: Regex.SOMETHING
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Resi Password',
				tooltip: 'Password used to login to Resi',
				width: 6,
				regex: Regex.SOMETHING
			}
		]
	}

	async createAPI(config: any) {
		this.log('debug', 'Creating API client')
		try {
			this.updateStatus(InstanceStatus.Connecting);
			this.resiApi = new ResiApi(config.username, config.password);

			this.log('debug', 'Getting token')
			await this.resiApi.getToken();
			this.log('debug', 'Getting user data')
			await this.resiApi.getMe();
			this.log('debug', 'API client created')

			this.log('debug', 'Getting actions')
			this.setActionDefinitions(await getActions(this))
			this.log('debug', 'Got actions')

			this.log('debug', 'Getting feedbacks')
			this.setFeedbackDefinitions(await getFeedbacks(this))
			this.log('debug', 'Got feedbacks')

			this.updateStatus(this.resiApi.needsUserData() ? InstanceStatus.ConnectionFailure : InstanceStatus.Ok)
		} catch (e) {
			this.updateStatus(InstanceStatus.ConnectionFailure, e.message)
		}
	}

}

runEntrypoint(ModuleInstance, [])
