/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

/**
 * The main class of this app. All the logic goes here.
 */
export default class HelloWorld {
	private kitItem: MRE.Actor = null;
	private assets: MRE.AssetContainer;

	constructor(private context: MRE.Context) {
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		// set up somewhere to store loaded assets (meshes, textures,
		// animations, gltfs, etc.)
		this.assets = new MRE.AssetContainer(this.context);

		// spawn a copy of a kit item
		this.kitItem = MRE.Actor.CreateFromLibrary(this.context, {
			// the number below is the item's artifact id.
			resourceId: 'artifact:1678659477454192669'
		});
	}
}
