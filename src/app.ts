/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

// import delay from './utils/delay';

/*
 * import sync-fix
 */
import { UserSyncFix } from './sync-fix'



//======================================
// Convert a rotation from Unity-style Euler angles to a Quaternion.
// If null or undefined passed in, use a 0 rotation.
//======================================
function Unity2QuaternionRotation(euler: MRE.Vector3Like):
	MRE.Quaternion {
	return euler ? MRE.Quaternion.FromEulerAngles(
		euler.x * MRE.DegreesToRadians,
		euler.y * MRE.DegreesToRadians,
		euler.z * MRE.DegreesToRadians
	) : new MRE.Quaternion();
}

/*
 * sleep() function
 *
 * Returns a Promise that resolves afer 'ms' milliseconds.  To cause your code to pause for that
 * time, use 'await sleep(ms)' in an async function.
 */
function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}



interface BodyTracker {
	foreTrack: MRE.Actor;
	neckTrack: MRE.Actor;
	spinemidTrack: MRE.Actor;
}



/**
 * The main class of this app. All the logic goes here.
 */
export default class grabbable {
	/*
	 * Declare a SyncFix object
	 * Set to refresh every 5000 ms (5 sec)
	 */
	private syncfix = new UserSyncFix(5000); // sync every 5000 milliseconds


	/*
	 * Track which attachments belongs to which user
	 * NOTE: The MRE.Guid will be the ID of the user.  Maps are more efficient with Guids for keys
	 * than they would be with MRE.Users.
	 */

	// private attachments = new Map<MRE.Guid, MRE.Actor>();
	private attachments = new Map<MRE.Guid, MRE.Actor []>();


	private text: MRE.Actor = null;
	private kitItemStylus: MRE.Actor = null;

	// private styleZ: MRE.Actor = null;
	// private styleY: MRE.Actor = null;
	// private styleX: MRE.Actor = null;

	// for triggers
	private userTrackers = new Map<MRE.Guid, BodyTracker>();


  // private fractCount = 0;

	private assets: MRE.AssetContainer;

	public rolesString: string;
	public rolesArray: string[];

	public wingsString: string;
	public wingsArray: string[];

	public chokerString: string;
	public chokerArray: string[];

	// public

	// private videoWand: MRE.Actor;

	public PI = Math.PI;
	public TAU = Math.PI*2;

	// private model: MRE.Actor = null;
	// private materials: MRE.Material[] = [];
	// private spamRoot: MRE.Actor;

	/**
	 * From GrabTest Functional test
	 *
	 */

	// public expectedResultDescription = "Different grabbable items.";
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
	// 		ramp.created().then(() => ramp.grabbable = true);
	// 	}
	// }

	// constructor(private context: MRE.Context, protected baseUrl: string, public params: MRE.ParameterSet ) {
	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {

		this.context.onStarted(() => this.started());
	}


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
			for (const attacheditem of userattachments ) {

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
	private started() {
		// set up somewhere to store loaded assets (meshes, textures,
		// animations, gltfs, etc.)
		this.assets = new MRE.AssetContainer(this.context);

		const positionValue = { x: 0, y: 0, z: 0 };

		// a root position parent:
		const rootPosition = MRE.Actor.Create(this.context, {
			actor: {
				name: `root-position`,
				// parentId: inclination.id,
				transform: {
					app: { position: positionValue }
				}
			}
		});


		//==========================
	// Set up the synchronization function
	//==========================
	this.syncfix.addSyncFunc(() => this.synchronizeAttachments());

		// this.roles = this.params.roles as
	this.rolesString = this.params.roles as string;
	this.rolesArray = this.rolesString.split(',');

	this.wingsString = this.params.wings as string;
	this.wingsArray = this.wingsString.split(',');

	this.chokerString = this.params.choker as string;
	this.chokerArray = this.chokerString.split(',');

	// if (this.params.roles === undefined) {
	// 			this.roles = "";
	// 		} else {
	// 			this.activeTestName = this.params.test as string;
	// 			this.activeTestFactory = Factories[this.activeTestName];
	// 			this.setupRunner();
	// 		}





//Uncomment this next block to trace values
		this.text = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Text',
				transform: {
					app: { position: { x:0, y:1, z:-10 },
					rotation: { x: 0, y: 90 * MRE.DegreesToRadians, z: 0 } }
				},
				text: {
					contents: "Hello Dear World!",
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 0.3
				}
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

				return true;

	}

	// after started

	//====================================
	// userJoined() -- attach a tracker to each user
	//====================================
	private userJoined(user: MRE.User) {
		//================================
		// Create a new tracker and attach it to the user
		//================================

		let choker: MRE.Actor = null;
		let wings: MRE.Actor = null;

		let attached: MRE.Actor[] = [];


		const usersRoles = user.properties["altspacevr-roles"];
		// const userRoles = user.properties;


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


		this.text.text.contents = "";
		// var names = 'Harry,John,Clark,Peter,Rohn,Alice';
		// var nameArr = this.roles.split(',');

		this.rolesArray.forEach((role) => {
			if (role=="show") this.text.text.contents = JSON.stringify(usersRoles);

			if (usersRoles.includes(role) || role == "all") {
				if (choker===null) {
					choker = MRE.Actor.CreateFromLibrary(this.context, {
						resourceId: 'artifact:1779817570145141338',
						actor: {
							attachment: {
								attachPoint: 'neck',
								userId: user.id
							},
							appearance: { enabled: true },
							transform: {
								local: {
									scale: { x:1.005, y:1.005, z:1.005 },
									position: {x:0, y:-.0275, z:-.005},
									rotation: MRE.Quaternion.FromEulerAngles(4*MRE.DegreesToRadians, 0, 0)
								},
							}
						}
					});
					attached.push(choker);
				}

				if (wings===null) {
					wings = MRE.Actor.CreateFromLibrary(this.context, {
						resourceId: 'artifact:1781612302869463999',
						actor: {
							attachment: {
								attachPoint: 'spine-middle',
								userId: user.id
							},
							appearance: { enabled: true },
							transform: {
								local: {
									scale: { x:1, y:1, z:1 },
									position: {x:0, y:.1, z:-.18}, //-.06 .15
									rotation: MRE.Quaternion.FromEulerAngles(-5*MRE.DegreesToRadians, 0, 0)
								},
							}
						}
					});
					attached.push(wings);
				}

				// Associate the attachment with the user in the 'attachments' map.
				// this.attachments.set(user.id, wings);
				// this.attachments.set(user.id, attached);
			}

		});

		this.chokerArray.forEach((role) => {
			if (usersRoles.includes(role) || role == "all") {
				if (choker===null) {
					choker = MRE.Actor.CreateFromLibrary(this.context, {
						resourceId: 'artifact:1779817570145141338',
						actor: {
							attachment: {
								attachPoint: 'neck',
								userId: user.id
							},
							appearance: { enabled: true },
							transform: {
								local: {
									scale: { x:1.005, y:1.005, z:1.005 },
									position: {x:0, y:-.0275, z:-.005},
									rotation: MRE.Quaternion.FromEulerAngles(4*MRE.DegreesToRadians, 0, 0)
								},
							}
						}
					});
					attached.push(choker);
				}
			}
		});

		this.wingsArray.forEach((role) => {
			if (usersRoles.includes(role) || role == "all") {
				if (wings===null) {
					wings = MRE.Actor.CreateFromLibrary(this.context, {
						resourceId: 'artifact:1781612302869463999',
						actor: {
							attachment: {
								attachPoint: 'spine-middle',
								userId: user.id
							},
							appearance: { enabled: true },
							transform: {
								local: {
									scale: { x:1, y:1, z:1 },
									position: {x:0, y:.1, z:-.18}, //-.06 .15
									rotation: MRE.Quaternion.FromEulerAngles(-5*MRE.DegreesToRadians, 0, 0)
								},
							}
						}
					});
					attached.push(wings);
				}
			}
		});

		this.attachments.set(user.id, attached);

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


			let userattachments:MRE.Actor[] = this.attachments.get(user.id);

			//added this looping through attachment array
			for (const attacheditem of userattachments ) {

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
