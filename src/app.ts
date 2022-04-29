/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
*  wss://trigger.openode.dev/?cpack=1912750109511123752&r=3   // Video-fractal
*  wss://trigger.openode.dev/?cpack=1912747872982401683   // Video-wand
*/

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

// import fetch from 'node-fetch';

// import delay from './utils/delay';

/*
 * import sync-fix
 */
import { UserSyncFix } from './sync-fix'


/**
 * The structure of a hat entry in the hat database.
 */
type ArtifactDescriptor = {
	displayName: string;
	resourceName: string;
	resourceId: string;
	attachPoint: string;
	trigger: boolean;
	rigidBody: boolean;
	scale: {
		x: number;
		y: number;
		z: number;
	};
	rotation: {
		x: number;
		y: number;
		z: number;
	};
	position: {
		x: number;
		y: number;
		z: number;
	};
};

/**
 * The structure of the hat database.
 */
type ArtifactDatabase = {
	[key: string]: ArtifactDescriptor;
};

// // Load the database of hats.
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const ArtifactDatabase: ArtifactDatabase = require('../public/hats.json');


//======================================
// Convert a rotation from Unity-style Euler angles to a Quaternion.
// If null or undefined passed in, use a 0 rotation.
//======================================
// function Unity2QuaternionRotation(euler: MRE.Vector3Like):
//   MRE.Quaternion {
//   return euler ? MRE.Quaternion.FromEulerAngles(
//     euler.x * MRE.DegreesToRadians,
//     euler.y * MRE.DegreesToRadians,
//     euler.z * MRE.DegreesToRadians
//   ) : new MRE.Quaternion();
// }

/*
 * sleep() function
 *
 * Returns a Promise that resolves afer 'ms' milliseconds.  To cause your code to pause for that
 * time, use 'await sleep(ms)' in an async function.
 */
// function sleep(ms: number) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }



interface BodyTracker {
	foreTrack: MRE.Actor;
	neckTrack: MRE.Actor;
	spinemidTrack: MRE.Actor;
}



/**
 * The main class of this app. All the logic goes here.
 */
export default class trigger {
	/*
	 * Declare a SyncFix object
	 * Set to refresh every 5000 ms (5 sec)
	 */
	private syncfix = new UserSyncFix(5000); // sync every 5000 milliseconds

	// console.log("ZZZzzzz n    x  XXXXX");
	/*
	 * Track which attachments belongs to which user
	 * NOTE: The MRE.Guid will be the ID of the user.  Maps are more efficient with Guids for keys
	 * than they would be with MRE.Users.
	 */

	// private attachments = new Map<MRE.Guid, MRE.Actor>();
	private attachments = new Map<MRE.Guid, MRE.Actor[]>();

	private prefabs: { [key: string]: MRE.Prefab } = {};

	private text: MRE.Actor = null;
	private kitItemStylus: MRE.Actor = null;

	// private styleZ: MRE.Actor = null;
	// private styleY: MRE.Actor = null;
	// private styleX: MRE.Actor = null;

	// for triggers
	private userTrackers = new Map<MRE.Guid, BodyTracker>();

	// private fractCount = 0;

	private assets: MRE.AssetContainer;

	// For the database of artifacts.
	private artifactDB: ArtifactDatabase;


	private contentPack: string;
	// private contentPack
	// public rolesString: string;
	// public rolesArray: string[];
	//
	// public wingsString: string;
	// public wingsArray: string[];
	//
	// public chokerString: string;
	// public chokerArray: string[];

	// public

	private videoWand: MRE.Actor;
	private fractalTransA: MRE.Actor;
	private fractalTransB: MRE.Actor;
	private fractalTransC: MRE.Actor;
	private boat: MRE.Actor;
	private holder: MRE.Actor;
	private doors: MRE.Actor;


	public PI = Math.PI;
	public TAU = Math.PI * 2;

	// private model: MRE.Actor = null;
	// private materials: MRE.Material[] = [];
	// private spamRoot: MRE.Actor;

	/**
	 * From GrabTest Functional test
	 *
	 */

	// public expectedResultDescription = "Different trigger items.";
	// private state = 0;
	// private clickCount = 0;

	// private assets: MRE.AssetContainer;

	private readonly SCALE = 0.2;

	public cleanup() {
		this.assets.unload();
	}

	// private spawnActors(count: number) {
	// 	if (this.spamRoot) {
	// 		this.spamRoot.destroy();
	// 	}
	//
	// 	const ball = this.assets.meshes.find(m => m.name === 'ball')
	// 		|| this.assets.createSphereMesh('ball', 0.05);
	//
	// 	this.spamRoot = MRE.Actor.Create(this.context, {
	// 		actor: {
	// 			name: 'spamRoot',
	// 			transform: { local: { position: { y: 1, z: -1 } } }
	// 		}
	// 	});
	//
	// 	for (let i = 0; i < count; i++) {
	// 		let ramp = MRE.Actor.CreateFromLibrary(this.context, {
	// 			resourceId: 'artifact:1703071908439786046',
	// 			actor: {
	// 				name: `ramp${i}`,
	// 				collider: { geometry: { shape: MRE.ColliderType.Auto } },
	// 				// appearance: {
	// 				// 	// meshId: boxMesh.id,
	// 				// 	materialId: this.materials[Math.floor(Math.random() * this.materials.length)].id
	// 				// },
	// 				transform: {
	// 					local: {
	// 						scale: { x: 0.5, y: 0.5, z: 0.5 },
	// 						position: { x: 0, y: i*.15, z: -.5 }
	// 					}
	// 				}
	// 			}
	// 		});
	// 		ramp.created().then(() => ramp.trigger = true);
	// 	}
	// }

	/* eslint-disable */
	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		// constructor(private context: MRE.Context, protected baseUrl: string) {
		// eslint-disable-next-line
    console.log("Test");
		this.context.onStarted(() => this.started());
	}
	/* eslint-enable */


	//==========================
	// Synchronization function for attachments
	// Need to detach and reattach every attachment
	//==========================
	private synchronizeAttachments() {
		// Loop through all values in the 'attachments' map
		// The [key, value] syntax breaks each entry of the map into its key and
		// value automatically.  In the case of 'attachments', the key is the
		// Guid of the user and the value is the actor/attachment.

		for (const [userId, userattachments] of this.attachments) {

			//added this looping through attachment array
			// for (const attacheditem of userattachments as Array<MRE.Actor> ) {
			for (const attacheditem of userattachments) {

				// Store the current attachpoint.
				const attachPoint = attacheditem.attachment.attachPoint;

				// Detach from the user
				attacheditem.detach();

				// Reattach to the user
				attacheditem.attach(userId, attachPoint);

			}
		}
	}


	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
		// Check whether code is running in a debuggable watched filesystem
		// environment and if so delay starting the app by 1 second to give
		// the debugger time to detect that the server has restarted and reconnect.
		// The delay value below is in milliseconds so 1000 is a one second delay.
		// You may need to increase the delay or be able to decrease it depending
		// on the speed of your PC.
		const delay = 1000;
		const argv = process.execArgv.join();
		const isDebug = argv.includes('inspect') || argv.includes('debug');


		// set up somewhere to store loaded assets (meshes, textures,
		// animations, gltfs, etc.)
		this.assets = new MRE.AssetContainer(this.context);

		// const positionValue = { x: 0, y: 0, z: 0 };

		// a root position parent:
		// const rootPosition = MRE.Actor.Create(this.context, {
		//   actor: {
		//     name: `root-position`,
		//     // parentId: inclination.id,
		//     transform: {
		//       app: { position: positionValue }
		//     }
		//   }
		// });

		//==========================
		// Set up the synchronization function
		//==========================
		// this.syncfix.addSyncFunc(() => this.synchronizeAttachments());

		// this.roles = this.params.roles as
		// this.rolesString = this.params.roles as string;
		// this.rolesArray = this.rolesString.split(',');
		//
		// this.wingsString = this.params.wings as string;
		// this.wingsArray = this.wingsString.split(',');
		//
		// this.chokerString = this.params.choker as string;
		// this.chokerArray = this.chokerString.split(',');

		// if (this.params.roles === undefined) {
		// 			this.roles = "";
		// 		} else {
		// 			this.activeTestName = this.params.test as string;
		// 			this.activeTestFactory = Factories[this.activeTestName];
		// 			this.setupRunner();
		// 		}
		this.contentPack = this.params.cpack as string;

		console.log('cpack: ', this.contentPack);
		// Load the database of artifacts
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		// this.artifactDB = require(`https://account.altvr.com/api/content_packs/${this.contentPack}/raw`);

		// this.videoWand = MRE.Actor.CreateFromLibrary(this.context, {
		// 	// resourceId: 'artifact:1768257866851943023', // fractal
		// 	resourceId: 'artifact:1794380576673759640',  //videoLumaWand
		// 	// resourceId: 'artifact:1772090341776688049',  //Luma Hue Ksqrd
		// 	// resourceId: 'artifact:1816236824872354109',  //videoWand
		// 	actor: {
		// 		name: "videoWand",
		// 		collider: { geometry: { shape: MRE.ColliderType.Auto } },
		// 		transform: {
		// 			local: {
		// 				scale: { x: 1, y: 1, z: 1 },
		// 				rotation: MRE.Quaternion.FromEulerAngles(0, 0, 0)
		// 			},
		// 			app: {
		// 				// position: { x:40, y:1, z:40 },
		// 				position: { x: 0, y: 5, z: 0 },
		// 				rotation: MRE.Quaternion.FromEulerAngles(Math.PI, 0, 0)
		// 			}
		// 		},
		// 		// rigidBody: {
		// 		// 	mass: 1,
		// 		// },
		// 		// subscriptions: ['transform'],
		// 	}
		// });
		//
		// this.videoWand.created().then(() => this.videoWand.trigger = true);
		//
		// this.fractalTransA = MRE.Actor.CreateFromLibrary(this.context, {
		// 	resourceId: 'artifact:1772090341776688049',  //Luma Hue Ksqrd
		// 	actor: {
		// 		name: "fractal1",
		// 		collider: { geometry: { shape: MRE.ColliderType.Auto } },
		// 		transform: {
		// 			local: {
		// 				scale: { x: 6, y: 6, z: 6 },
		// 				rotation: MRE.Quaternion.FromEulerAngles(0, 0, 0)
		// 			},
		// 			app: {
		// 				// position: { x:40, y:1, z:40 },
		// 				position: { x: 0, y: 0, z: 0 },
		// 				rotation: MRE.Quaternion.FromEulerAngles(Math.PI, 0, 0)
		// 			}
		// 		}
		// 	}
		// });
		// this.fractalTransA.created().then(() => this.fractalTransA.trigger = true);
		//
		// this.fractalTransB = MRE.Actor.CreateFromLibrary(this.context, {
		// 	resourceId: 'artifact:1772090341776688049',  //Luma Hue Ksqrd
		// 	actor: {
		// 		name: "fractal2",
		// 		collider: { geometry: { shape: MRE.ColliderType.Auto } },
		// 		transform: {
		// 			local: {
		// 				scale: { x: 5, y: 5, z: 5 },
		// 				rotation: MRE.Quaternion.FromEulerAngles(0, 0, 0)
		// 			},
		// 			app: {
		// 				position: { x: 0, y: 0, z: 0 },
		// 				rotation: MRE.Quaternion.FromEulerAngles(Math.PI, 0, 0)
		// 			}
		// 		}
		// 	}
		// });
		// this.fractalTransB.created().then(() => this.fractalTransB.trigger = true);
		//
		// this.fractalTransC = MRE.Actor.CreateFromLibrary(this.context, {
		// 	resourceId: 'artifact:1772090341776688049',  //Luma Hue Ksqrd
		// 	actor: {
		// 		name: "fractal2",
		// 		collider: { geometry: { shape: MRE.ColliderType.Auto } },
		// 		transform: {
		// 			local: {
		// 				scale: { x: 5, y: 5, z: 5 },
		// 				rotation: MRE.Quaternion.FromEulerAngles(0, 0, 0)
		// 			},
		// 			app: {
		// 				position: { x: 0, y: 0, z: 0 },
		// 				rotation: MRE.Quaternion.FromEulerAngles(Math.PI, 0, 0)
		// 			}
		// 		}
		// 	}
		// });
		// this.fractalTransC.created().then(() => this.fractalTransC.trigger = true);

		this.boat = MRE.Actor.CreateFromLibrary(this.context, {
			resourceId: 'artifact:1140475624821883478',  //holder
			actor: {
				name: "boat",
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						scale: { x: 1.25, y: 1.25, z: 1.25 },
						position: { x: 0, y: 0, z: 0 },
						rotation: MRE.Quaternion.FromEulerAngles(0, 0, 0)
					},
					app: {
						position: { x: 0, y: -.55, z: 0 },
						rotation: MRE.Quaternion.FromEulerAngles(-2 * MRE.DegreesToRadians, 0, 0)
					}
				}
			}
		});


		this.holder = MRE.Actor.CreateFromLibrary(this.context, {
			resourceId: 'artifact:1943340717036274377',  //holder
			actor: {
				name: "holder",
				parentId: this.boat.id,
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						scale: { x: 1, y: 1, z: 1 },
						position: { x: 0, y: 1.65, z: .25 },
						rotation: MRE.Quaternion.FromEulerAngles(2 * MRE.DegreesToRadians, 0, 0)
					},
					app: {
						rotation: MRE.Quaternion.FromEulerAngles(0, 0, 0)
					}
				},
				appearance: { enabled: false }
			}
		});
		// this.holder.created().then(() => this.holder.trigger = true);

		this.doors = MRE.Actor.CreateFromLibrary(this.context, {
			resourceId: 'artifact:1943376618743398910',  //holder
			actor: {
				name: "doors",
				parentId: this.boat.id,
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						scale: { x: 1, y: 1, z: 1 },
						position: { x: 0, y: -.375, z: .25 },
						rotation: MRE.Quaternion.FromEulerAngles(2 * MRE.DegreesToRadians, 0, 0)
					},
					app: {
						rotation: MRE.Quaternion.FromEulerAngles(0, 0, 0)
					}
				},
				appearance: { enabled: false }
			}
		});

		this.boat.created().then(() => {
			this.boat.trigger = true;
			this.boat.onGrab('begin', () => {
				// this.doors.appearance.enabled = false;
				this.doors.collider.enabled = true;
				this.doors.transform.local.position.y = 1.75;
				// this.state = 1;
				// this.cycleState();
			});
			this.boat.onGrab('end', () => {
				// this.doors.collider.enabled = false;
				// this.doors.appearance.enabled = false;
				this.doors.transform.local.position.y = -.375;


				// this.state = 2;
				// this.cycleState();
			});
		});


		// this.doors.created().then(() => this.doors.trigger = true);




		//Uncomment this next block to trace values
		this.text = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Text',
				parentId: this.boat.id,
				transform: {
					// local: {
					// 	scale: { x: 1, y: 1, z: 1 },
					// 	// position: { x: 0, y: .5, z: -3 },
					// 	rotation: MRE.Quaternion.FromEulerAngles(2 * MRE.DegreesToRadians, 0, 0)
					// },
					app: {
						position: { x: .04, y: .59, z: -2.98 },
						rotation: MRE.Quaternion.FromEulerAngles(-10 * MRE.DegreesToRadians, 0, 0)
					}
				},
				text: {
					contents: `Swash     buckler`,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: { r: 0 / 255, g: 0 / 255, b: 0 / 255 },
					height: 0.125
				},
				appearance: { enabled: true }
			}
		});


		//=============================
		// Set up a userJoined() callback to attach userTrackers to the Users.
		//=============================
		this.context.onUserJoined((user) => this.userJoined(user));

		//=============================
		// Set up a userLeft() callback to clean up userTrackers as Users leave.
		//=============================
		this.context.onUserLeft((user) => this.userLeft(user));



		// //====================
		// // Call an async function to "pulse" the size of the kit item in a loop.
		// //====================
		// this.rotateActor(this.styleX, this.styleY, this.styleZ);
		// this.fractalize();

		// return true;
		console.log("pepepe  frankenstein");

		// version to use with async code
		if (isDebug) {
			await new Promise(resolve => setTimeout(resolve, delay));
			await this.startedImpl();
		} else {
			await this.startedImpl();
		}

	}

	// after started

	// use () => {} syntax here to get proper scope binding when called via setTimeout()
	// if async is required, next line becomes private startedImpl = async () => {
	private startedImpl = async () => {
		// Preload all the hat models.
		await this.preloadArtifacts();
		// Show the hat menu.
		// this.showHatMenu();
	}

	/**
	 * Preload all hat resources. This makes instantiating them faster and more efficient.
	 */
	private preloadArtifacts() {


		// Loop over the Content Pack database, preloading each resource.
		// Return a promise of all the in-progress load promises. This
		// allows the caller to wait until all artifacts are done preloading
		// before continuing.
		// ${this.baseUrl}/${hatRecord.resourceName}`)
		// console.log(`baseURL: ${this.baseUrl}`);
		return Promise.all(
			Object.keys(this.artifactDB).map(artId => {
				const artRecord = this.artifactDB[artId];
				if (artRecord.resourceName) {
					return this.assets.loadGltf(
						`${artRecord.resourceName}`)
						.then(assets => {
							this.prefabs[artId] = assets.find(a => a.prefab !== null) as MRE.Prefab;
						})
						.catch(e => MRE.log.error("app", e));
					// } else if (artRecord.resourceId){

				} else {
					return Promise.resolve();
				}
			}));
	}

	private loadArtifacts() {



	}


	//====================================
	// userJoined() -- attach a tracker to each user
	//====================================
	private userJoined(user: MRE.User) {
		//================================
		// Create a new tracker and attach it to the user
		//================================

		// let choker: MRE.Actor = null;
		// let wings: MRE.Actor = null;

		// let attached: MRE.Actor[] = [];


		// const usersRoles = user.properties["altspacevr-roles"];
		// const userRoles = user.properties;

		// eslint-disable-next-line
		const tracker: MRE.Actor = MRE.Actor.CreatePrimitive(this.assets,
			{
				// Make the attachment a small box.
				definition: {
					shape: MRE.PrimitiveShape.Box,
					dimensions: { x: 0.1, y: 0.1, z: 0.1 }
				},

				//========================
				// Make the attachment between the eyes and invisible.
				//========================
				actor: {
					attachment: {
						attachPoint: 'center-eye',
						userId: user.id
					},
					appearance: { enabled: false },

					//========================
					// Need to subscribe to 'transform' so trigger will work for everyone.
					// Without the subscription, the trigger will work for just one person.
					//========================
					subscriptions: ['transform'],
				},

				//========================
				// With attachments like this, we don't need to add a rigidBody explicitly.
				//========================
				addCollider: true
			}
		);


		// this.text.text.contents = this.contentPack; //"";
		// var names = 'Harry,John,Clark,Peter,Rohn,Alice';
		// var nameArr = this.roles.split(',');

		// this.rolesArray.forEach((role) => {
		// 	if (role=="show") this.text.text.contents = JSON.stringify(usersRoles);
		//
		// 	if (usersRoles.includes(role) || role == "all") {
		// 		if (choker===null) {
		// 			choker = MRE.Actor.CreateFromLibrary(this.context, {
		// 				resourceId: 'artifact:1779817570145141338',
		// 				actor: {
		// 					attachment: {
		// 						attachPoint: 'neck',
		// 						userId: user.id
		// 					},
		// 					appearance: { enabled: true },
		// 					transform: {
		// 						local: {
		// 							scale: { x:1.005, y:1.005, z:1.005 },
		// 							position: {x:0, y:-.0275, z:-.005},
		// 							rotation: MRE.Quaternion.FromEulerAngles(4*MRE.DegreesToRadians, 0, 0)
		// 						},
		// 					}
		// 				}
		// 			});
		// 			attached.push(choker);
		// 		}
		//
		// 		if (wings===null) {
		// 			wings = MRE.Actor.CreateFromLibrary(this.context, {
		// 				resourceId: 'artifact:1781612302869463999',
		// 				actor: {
		// 					attachment: {
		// 						attachPoint: 'spine-middle',
		// 						userId: user.id
		// 					},
		// 					appearance: { enabled: true },
		// 					transform: {
		// 						local: {
		// 							scale: { x:1, y:1, z:1 },
		// 							position: {x:0, y:.1, z:-.18}, //-.06 .15
		// 							rotation: MRE.Quaternion.FromEulerAngles(-5*MRE.DegreesToRadians, 0, 0)
		// 						},
		// 					}
		// 				}
		// 			});
		// 			attached.push(wings);
		// 		}
		// 	}
		// });

		// this.chokerArray.forEach((role) => {
		// 	if (usersRoles.includes(role) || role == "all") {
		// 		if (choker===null) {
		// 			choker = MRE.Actor.CreateFromLibrary(this.context, {
		// 				resourceId: 'artifact:1779817570145141338',
		// 				actor: {
		// 					attachment: {
		// 						attachPoint: 'neck',
		// 						userId: user.id
		// 					},
		// 					appearance: { enabled: true },
		// 					transform: {
		// 						local: {
		// 							scale: { x:1.005, y:1.005, z:1.005 },
		// 							position: {x:0, y:-.0275, z:-.005},
		// 							rotation: MRE.Quaternion.FromEulerAngles(4*MRE.DegreesToRadians, 0, 0)
		// 						},
		// 					}
		// 				}
		// 			});
		// 			attached.push(choker);
		// 		}
		// 	}
		// });

		// this.wingsArray.forEach((role) => {
		// 	if (usersRoles.includes(role) || role == "all") {
		// 		if (wings===null) {
		// 			wings = MRE.Actor.CreateFromLibrary(this.context, {
		// 				resourceId: 'artifact:1781612302869463999',
		// 				actor: {
		// 					attachment: {
		// 						attachPoint: 'spine-middle',
		// 						userId: user.id
		// 					},
		// 					appearance: { enabled: true },
		// 					transform: {
		// 						local: {
		// 							scale: { x:1, y:1, z:1 },
		// 							position: {x:0, y:.1, z:-.18}, //-.06 .15
		// 							rotation: MRE.Quaternion.FromEulerAngles(-5*MRE.DegreesToRadians, 0, 0)
		// 						},
		// 					}
		// 				}
		// 			});
		// 			attached.push(wings);
		// 		}
		// 	}
		// });





		// this.attachments.set(user.id, attached);

		/*
		 * Let the syncFix know another user has joined.
		 */
		this.syncfix.userJoined();
	}

	//====================================
	// userLeft() -- clean up tracker as users leave
	//====================================
	private userLeft(user: MRE.User) {
		//================================
		// If the user has a tracker, delete it.
		//================================
		// if (this.userTrackers.has(user.id)) {
		// 	const trackers = this.userTrackers.get(user.id);
		// 	trackers.foreTrack.detach();
		// 	trackers.foreTrack.destroy();
		//
		// 	trackers.neckTrack.detach();
		// 	trackers.neckTrack.destroy();
		//
		// 	trackers.spinemidTrack.detach();
		// 	trackers.spinemidTrack.destroy();
		// 	// trackers.rightHandTrack.detach();
		// 	// trackers.rightHandTrack.destroy();
		// 	// trackers.fractalTrans.detach();
		// 	// trackers.fractalTrans.destroy();
		// 	// this.resetVenusVidSphere(String(user.id));
		//
		// 	// Remove the entry from the map.
		// 	this.userTrackers.delete(user.id);
		// }

		if (this.attachments.has(user.id)) {


			const userattachments: MRE.Actor[] = this.attachments.get(user.id);

			//added this looping through attachment array
			for (const attacheditem of userattachments) {

				// Detach the Actor from the user
				attacheditem.detach();

				// Destroy the Actor.
				attacheditem.destroy();
			}
			// Remove the attachment from the 'attachments' map.
			this.attachments.delete(user.id);
		}
	}

}
