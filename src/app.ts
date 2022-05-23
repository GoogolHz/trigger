/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
*  wss://trigger.openode.dev/?cpack=1912750109511123752&r=3   // Video-fractal
*  wss://trigger.openode.dev/?cpack=1912747872982401683   // Video-wand
*/

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import fetch from 'node-fetch';
// mod.cjs
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// const fetchPromise = import('node-fetch').then(mod => mod.default);
// const fetch = (...args) => fetchPromise.then(fetch => fetch(...args));
// import delay from './utils/delay';

/*
 * import sync-fix
 */
import { UserSyncFix } from './sync-fix'

const DEBUG = false;

/**
 * The structure of a hat entry in the hat database.
 */

type artifactDescriptor = {
  displayName: string;  // name of actor
	resourceURL: string;  // glb/gltf resource url
	resourceId: string;  // AltVR artifact ID
	attachPoint: string;
	grabbable: boolean;
	rigidBody: boolean;
	exclusive: boolean;
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
	menuScale: {
		x: number;
		y: number;
		z: number;
	};
	menuRotation: {
		x: number;
		y: number;
		z: number;
	};
	menuPosition: {
		x: number;
		y: number;
		z: number;
	};
 };

type triggerDescriptor = {
	displayName: string;
	triggerType: string; // Menu, Box, Capsule, Cylindar, Plane, Sphere, Custom
	isVisible: boolean;
	triggerTransform: {
    dimensions: {
      x: number;
      y: number;
      z: number;
    };
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
	triggeredOnEnter: triggeredOnEvent;
	triggeredOnExit: triggeredOnEvent;
};

type menuDescriptor = {
  displayName: string;  // name of actor
  resourceURL: string;  // glb/gltf resource url
  resourceId: string;  // AltVR artifact ID
  options: {
    previewMargin: number;
  }
  attachPoint: string;
  grabbable: boolean;
  exclusive: boolean;
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
  menuScale: {
    x: number;
    y: number;
    z: number;
  };
  menuRotation: {
    x: number;
    y: number;
    z: number;
  };
  menuPosition: {
    x: number;
    y: number;
    z: number;
  };
};

type triggeredOnEvent = {
  killResources: string[];
  spawnResources: string[];
}

//[key: string] is an index signature

/**
 * The structure of the hat database.
 */
type artifactDatabase = {
	[key: string]: artifactDescriptor;
};

type triggerDatabase = {
	[key: string]: triggerDescriptor;
};


// [key: string]: triggerDescriptor | artifactDescriptor | string[] | menuDescriptor;

type triggerMREDatabase = {
  Triggers: triggerDatabase;
  Artifacts: artifactDatabase;
  spawnAtStartup: string[];
  MenuSetup: menuDescriptor;
};

type primitiveShapes = {
  'Box': MRE.PrimitiveShape.Box,
  'Capsule': MRE.PrimitiveShape.Capsule,
  'Cylinder': MRE.PrimitiveShape.Cylinder,
  'Plane': MRE.PrimitiveShape.Plane,
  'Sphere': MRE.PrimitiveShape.Sphere
}

// type TriggerMREDatabase = {
//   Triggers: triggerDescriptor;
//   Artifacts: artifactDescriptor;
//   SpawnAtStartup: string[];
//   MenuSetup: menuDescriptor;
// };

// // Load the database of hats.
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const TriggerDatabase: TriggerDatabase = require('../public/hats.json');

//
// ======================================
// Convert a rotation from Unity-style Euler angles to a Quaternion.
// If null or undefined passed in, use a 0 rotation.
// ======================================
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

type AttachedActor = {
	resourceId: String;
	actor:  MRE.Actor;
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

	// for triggers
	private userTrackers = new Map<MRE.Guid, BodyTracker>();

	private assets: MRE.AssetContainer;

	// For the database of triggers.
  private triggerDB: triggerDatabase; //TriggerDatabase;
  private triggerMREDB: triggerMREDatabase; //TriggerDatabase;
  private artifactDB: artifactDatabase; //TriggerDatabase;
  private menuSetup: menuDescriptor;

	private previewMargin = 1.5; // spacing between preview objects

	private contentPack: string;

	private TriggerConfig: Promise<void> = null;

  private primitiveShapes: primitiveShapes;

	public PI = Math.PI;
	public TAU = Math.PI * 2;

	private readonly SCALE = 0.2;

	public cleanup() {
		this.assets.unload();
	}

	// private spawnActors(count: number) {
	//	if (this.spamRoot) {
	//		this.spamRoot.destroy();
	//	}
	//
	//	const ball = this.assets.meshes.find(m => m.name === 'ball')
	//		|| this.assets.createSphereMesh('ball', 0.05);
	//
	//	this.spamRoot = MRE.Actor.Create(this.context, {
	//		actor: {
	//			name: 'spamRoot',
	//			transform: { local: { position: { y: 1, z: -1 } } }
	//		}
	//	});
	//
	//	for (let i = 0; i < count; i++) {
	//		let ramp = MRE.Actor.CreateFromLibrary(this.context, {
	//			resourceId: 'artifact:1703071908439786046',
	//			actor: {
	//				name: `ramp${i}`,
	//				collider: { geometry: { shape: MRE.ColliderType.Auto } },
	//				// appearance: {
	//				//	// meshId: boxMesh.id,
	//				//	materialId: this.materials[Math.floor(Math.random() * this.materials.length)].id
	//				// },
	//				transform: {
	//					local: {
	//						scale: { x: 0.5, y: 0.5, z: 0.5 },
	//						position: { x: 0, y: i*.15, z: -.5 }
	//					}
	//				}
	//			}
	//		});
	//		ramp.created().then(() => ramp.trigger = true);
	//	}
	// }

  /* eslint-disable */
	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		// constructor(private context: MRE.Context, protected baseUrl: string) {
		// eslint-disable-next-line
		console.log(">>>	constructor()");

		this.contentPack = String(this.params.cpack || this.params.content_pack);

		if (this.contentPack) {
			// Specify a url to a JSON file
			// https://account.altvr.com/content_packs/1187493048011980938
			// e.g. ws://10.0.1.89:3901?content_pack=1187493048011980938
			fetch(`https://account.altvr.com/api/content_packs/${this.contentPack}/raw.json`, { method: "Get" })
				.then((response: any) => response.json())
				.then((json: any) => {
					if(DEBUG){ console.log(json); }
					// this.artifactDB = Object.assign({}, json);
          this.triggerMREDB = Object.assign({}, json);
          // this.triggerMREDB = JSON.parse(JSON.stringify(json));
					console.log('cpack: ', JSON.stringify(this.triggerMREDB, null, '\t'));
					// this.context.onStarted(() => this.started());
					this.started();
				});
		}
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
		this.syncfix.addSyncFunc(() => this.synchronizeAttachments());

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
		//			this.roles = "";
		//		} else {
		//			this.activeTestName = this.params.test as string;
		//			this.activeTestFactory = Factories[this.activeTestName];
		//			this.setupRunner();
		//		}
		// this.contentPack = this.params.cpack as string;
    //
		// console.log('cpack: ', this.contentPack);
		// Load the database of artifacts
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		// this.artifactDB = require(`https://account.altvr.com/api/content_packs/${this.contentPack}/raw`);


		//Uncomment this next block to trace values
		// this.text = MRE.Actor.Create(this.context, {
		//	actor: {
		//		name: 'Text',
		//		parentId: this.boat.id,
		//		transform: {
		//			// local: {
		//			//	scale: { x: 1, y: 1, z: 1 },
		//			//	// position: { x: 0, y: .5, z: -3 },
		//			//	rotation: MRE.Quaternion.FromEulerAngles(2 * MRE.DegreesToRadians, 0, 0)
		//			// },
		//			app: {
		//				position: { x: .04, y: .59, z: -2.98 },
		//				rotation: MRE.Quaternion.FromEulerAngles(-10 * MRE.DegreesToRadians, 0, 0)
		//			}
		//		},
		//		text: {
		//			contents: `Swash     buckler`,
		//			anchor: MRE.TextAnchorLocation.MiddleCenter,
		//			color: { r: 0 / 255, g: 0 / 255, b: 0 / 255 },
		//			height: 0.125
		//		},
		//		appearance: { enabled: true }
		//	}
		// });


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
		// Parse json data and preload artifacts.
		await this.preloadGLTFs();
		// Show the hat menu.
		// this.showHatMenu();
		console.log("GLTFs Preloaded");
		this.triggerFactory();
	}


	/**
	 * Preload all hat resources. This makes instantiating them faster and more efficient.
	 */
	private preloadGLTFs() {
    // this needs some rearanging

		// Loop over the Content Pack database, preloading each resource.
		// Return a promise of all the in-progress load promises. This
		// allows the caller to wait until all artifacts are done preloading
		// before continuing.
		// ${this.baseUrl}/${hatRecord.resourceName}`)
		// console.log(`baseURL: ${this.baseUrl}`);


    this.artifactDB = this.triggerMREDB["Artifacts"];
    // console.log("***> Artifacts", JSON.stringify(this.artifactDB, null, '\t'));
		// return Promise.all(
		// 	Object.keys(this.artifactDB).map(artifactId => {
    //     const artRecord = this.artifactDB[artifactId];
    //     if (artRecord.resourceId) {
    //       return this.assets.loadGltf(
    //         `${artRecord.resourceId}`)
    //         .then(assets => {
    //           this.prefabs[artifactId] = assets.find(a => a.prefab !== null) as MRE.Prefab;
    //         })
    //         .catch(e => MRE.log.error("app", e));
    //     } else {
    //       return Promise.resolve();
    //     }
		// 	})
    // );
	}
  private getPrimitiveShape(prime: string) {
    switch (prime) {
      case 'Box':
        return MRE.PrimitiveShape.Box;
      case 'Capsule':
        return MRE.PrimitiveShape.Capsule;
      case 'Cylinder':
        return MRE.PrimitiveShape.Cylinder;
      case 'Plane':
        return MRE.PrimitiveShape.Plane;
      case 'Sphere':
        return MRE.PrimitiveShape.Sphere
    }
  }

  private triggerFactory() {
    console.log("  >>>>triigered");
    this.triggerDB = this.triggerMREDB["Triggers"];
		const triggers = Object.entries(this.triggerDB);

    let makeMenu = false;
    let menu: MRE.Actor = null;


    triggers.forEach(([key, value]) => {
      // let button;
      let trigger: MRE.Actor = null;
      const triggerShapeType: string = value.triggerType;
      const trigTransform = value.triggerTransform;
      const triggeredOnEnter: triggeredOnEvent = value.triggeredOnEnter;
      const triggeredOnExit: triggeredOnEvent = value.triggeredOnExit;

      if (triggerShapeType === "Menu") {
        makeMenu = true;
      } else {
        // console.log(`trigger shape: ${triggerShapeType}`);
        // console.log('typeof MRE.PrimitiveShape:',typeof(MRE.PrimitiveShape));
        // console.log('typeof MRE.PrimitiveShape.Box:',typeof(MRE.PrimitiveShape.Box));
        // console.log('      MRE.PrimitiveShape.Box:', MRE.PrimitiveShape.Box);
        // console.log(`trigger: ${JSON.stringify(MRE.PrimitiveShape.Box,null,3)} `);
//             shape: this.primitiveShapes[triggerShapeType as keyof primitiveShapes],
//            shape: <keyof typeof MRE.PrimitiveShape> triggerShapeType,

        trigger = MRE.Actor.CreatePrimitive(this.assets, {
          definition: {
            shape: this.getPrimitiveShape(triggerShapeType),
            dimensions: trigTransform.dimensions // make sure there's a gap
          },
          addCollider: true,
          actor: {
            transform: {
              local: {
                position: trigTransform.position,
                scale: trigTransform.scale, // not affected by custom scale
                rotation: trigTransform.rotation
              }
            },
            appearance: {
              enabled: true
            }
          }
        });
        // trigger.setBehavior(MRE.ButtonBehavior).onClick(user => this.wearAccessory(key, user.id));
        trigger.created().then(() => {
          trigger.collider.isTrigger = true;
          trigger.collider.onTrigger('trigger-enter', (actor) => this.triggeredActions(actor, triggeredOnEnter));
          trigger.collider.onTrigger('trigger-exit',  (actor) => this.triggeredActions(actor, triggeredOnExit));
        });

      }

    });

    if (makeMenu) {
			console.log("makeMenu");
			// Create a parent object for all the menu items.
      this.menuSetup = this.triggerMREDB["MenuSetup"];
			menu = MRE.Actor.Create(this.context);
			if (this.menuSetup.options.previewMargin){
				this.previewMargin = this.menuSetup.options.previewMargin;
			}
		}

	}

  /**
 	 * Instantiate a artifact and attach it to the avatar's head.
 	 * @param hatId The id of the hat in the hat database.
 	 * @param userId The id of the user we will attach the hat to.
 	 */
  private triggeredActions(tracker: MRE.Actor, triggered: triggeredOnEvent) {

    // console.log("triggered?", triggered)
    console.log(`---triggered? ${JSON.stringify(triggered,null,3)} `);
    // const hatRecord = this.artifactDB[hatId];
    //
    // console.log(` >> hatId: ${hatId}, userId: ${userId}`);
    // let userattachments: MRE.Actor[] = [];
    // if (this.attachments.has(userId)) {
    //   console.log(`this.attachments.has(${userId})`);
    //   userattachments = this.attachments.get(userId);
    //
    //   //added this looping through attachment array
    //   for (const attacheditem of userattachments) {
    //     console.log(`---attacheditem ${JSON.stringify(attacheditem,null,3)} ===hatId ${hatId}`);
    //
    //
    //   }
    //
    // }
    //
    // // this.text.text = hatId;
    // // If the user selected 'clear', then early out.
    //
    // if (hatId === "clear!") {
    //   // console.log("clearing");
    //     // If the user is wearing a hat, destroy it.
    //     // if (this.attachments.has(userId)) this.attachments.get(userId).destroy();
    //     // this.attachments.delete(userId);
    //     this.removeUserAttachments(userId);
    //     return;
    // } else if (userattachments.length >=2 ){
    //   return;
    // }
    // // else if (hatId == "moveup!") {
    // // 		if (this.attachments.has(userId))
    // // 				this.attachments.get(userId).transform.local.position.y += 0.01;
    // // 		return;
    // // }
    // // else if (hatId == "movedown!") {
    // // 		if (this.attachments.has(userId))
    // // 				this.attachments.get(userId).transform.local.position.y -= 0.01;
    // // 		return;
    // // }
    // // else if (hatId == "moveforward!") {
    // // 		if (this.attachments.has(userId))
    // // 				this.attachments.get(userId).transform.local.position.z += 0.01;
    // // 		return;
    // // }
    // // else if (hatId == "moveback!") {
    // // 		if (this.attachments.has(userId))
    // // 				this.attachments.get(userId).transform.local.position.z -= 0.01;
    // // 		return;
    // // }
    // // else if (hatId == "sizeup!") {
    // // 		if (this.attachments.has(userId)){
    // // 				this.attachments.get(userId).transform.local.scale.x += 0.02;
    // // 				this.attachments.get(userId).transform.local.scale.y += 0.02;
    // // 				this.attachments.get(userId).transform.local.scale.z += 0.02;
    // // 		}
    // // 		return;
    // // }
    // // else if (hatId == "sizedown!") {
    // // 		if (this.attachments.has(userId)){
    // // 				this.attachments.get(userId).transform.local.scale.x -= 0.02;
    // // 				this.attachments.get(userId).transform.local.scale.y -= 0.02;
    // // 				this.attachments.get(userId).transform.local.scale.z -= 0.02;
    // // 		}
    // // 		return;
    // // }
    //
    // // If the user is wearing a hat, destroy it.
    // // this.removeUserAttachments(userId);
    // // if (this.attachedHats.has(userId)) this.attachedHats.get(userId).destroy();
    // // this.attachedHats.delete(userId);
    // // this.removeUserAttachments(userId);
    //
    // // let attached: MRE.Actor[] = [];
    //
    // // const hatRecord = this.artifactDB[hatId];
    //
    // // Create the hat model and attach it to the avatar's head.
    // // Jimmy
    //
    // const position = hatRecord.position ? hatRecord.position : { x: 0, y: 0, z: 0 }
    // const scale = hatRecord.scale ? hatRecord.scale : { x: 1.5, y: 1.5, z: 1.5 }
    // const rotation = hatRecord.rotation ? hatRecord.rotation : { x: 0, y: 180, z: 0 }
    // // const attachPoint = <MRE.AttachPoint> (hatRecord.attachPoint ? hatRecord.attachPoint : 'head')
    // const attachPoint = (hatRecord.attachPoint ? hatRecord.attachPoint : 'head') as MRE.AttachPoint;
    //
    // const actor = MRE.Actor.CreateFromLibrary(this.context, {
    //   resourceId: hatRecord.resourceId,
    //   actor: {
    //     transform: {
    //       local: {
    //         position: position,
    //         rotation: MRE.Quaternion.FromEulerAngles(
    //           rotation.x * MRE.DegreesToRadians,
    //           rotation.y * MRE.DegreesToRadians,
    //           rotation.z * MRE.DegreesToRadians),
    //         scale: scale
    //       }
    //     },
    //     attachment: {
    //       attachPoint: attachPoint,
    //       userId: userId
    //     }
    //   }
    // });
    //
    //
    // // let attach:AttachedActor = new AttachedActor;
    // // attach.resourceId = hatRecord.resourceId;
    // // attach.actor = actor;
    //
    // // console.log(" - - - - ", JSON.stringify(attach,null, 3));
    // // AttachedActor {
    // // 	resourceId: String;
    // // 	actor:  MRE.Actor;
    // // }
    // userattachments.push(actor);
    // this.attachments.set(userId, userattachments);
    //

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
		//	if (role=="show") this.text.text.contents = JSON.stringify(usersRoles);
		//
		//	if (usersRoles.includes(role) || role == "all") {
		//		if (choker===null) {
		//			choker = MRE.Actor.CreateFromLibrary(this.context, {
		//				resourceId: 'artifact:1779817570145141338',
		//				actor: {
		//					attachment: {
		//						attachPoint: 'neck',
		//						userId: user.id
		//					},
		//					appearance: { enabled: true },
		//					transform: {
		//						local: {
		//							scale: { x:1.005, y:1.005, z:1.005 },
		//							position: {x:0, y:-.0275, z:-.005},
		//							rotation: MRE.Quaternion.FromEulerAngles(4*MRE.DegreesToRadians, 0, 0)
		//						},
		//					}
		//				}
		//			});
		//			attached.push(choker);
		//		}
		//
		//		if (wings===null) {
		//			wings = MRE.Actor.CreateFromLibrary(this.context, {
		//				resourceId: 'artifact:1781612302869463999',
		//				actor: {
		//					attachment: {
		//						attachPoint: 'spine-middle',
		//						userId: user.id
		//					},
		//					appearance: { enabled: true },
		//					transform: {
		//						local: {
		//							scale: { x:1, y:1, z:1 },
		//							position: {x:0, y:.1, z:-.18}, //-.06 .15
		//							rotation: MRE.Quaternion.FromEulerAngles(-5*MRE.DegreesToRadians, 0, 0)
		//						},
		//					}
		//				}
		//			});
		//			attached.push(wings);
		//		}
		//	}
		// });

		// this.chokerArray.forEach((role) => {
		//	if (usersRoles.includes(role) || role == "all") {
		//		if (choker===null) {
		//			choker = MRE.Actor.CreateFromLibrary(this.context, {
		//				resourceId: 'artifact:1779817570145141338',
		//				actor: {
		//					attachment: {
		//						attachPoint: 'neck',
		//						userId: user.id
		//					},
		//					appearance: { enabled: true },
		//					transform: {
		//						local: {
		//							scale: { x:1.005, y:1.005, z:1.005 },
		//							position: {x:0, y:-.0275, z:-.005},
		//							rotation: MRE.Quaternion.FromEulerAngles(4*MRE.DegreesToRadians, 0, 0)
		//						},
		//					}
		//				}
		//			});
		//			attached.push(choker);
		//		}
		//	}
		// });

		// this.wingsArray.forEach((role) => {
		//	if (usersRoles.includes(role) || role == "all") {
		//		if (wings===null) {
		//			wings = MRE.Actor.CreateFromLibrary(this.context, {
		//				resourceId: 'artifact:1781612302869463999',
		//				actor: {
		//					attachment: {
		//						attachPoint: 'spine-middle',
		//						userId: user.id
		//					},
		//					appearance: { enabled: true },
		//					transform: {
		//						local: {
		//							scale: { x:1, y:1, z:1 },
		//							position: {x:0, y:.1, z:-.18}, //-.06 .15
		//							rotation: MRE.Quaternion.FromEulerAngles(-5*MRE.DegreesToRadians, 0, 0)
		//						},
		//					}
		//				}
		//			});
		//			attached.push(wings);
		//		}
		//	}
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
		//	const trackers = this.userTrackers.get(user.id);
		//	trackers.foreTrack.detach();
		//	trackers.foreTrack.destroy();
		//
		//	trackers.neckTrack.detach();
		//	trackers.neckTrack.destroy();
		//
		//	trackers.spinemidTrack.detach();
		//	trackers.spinemidTrack.destroy();
		//	// trackers.rightHandTrack.detach();
		//	// trackers.rightHandTrack.destroy();
		//	// trackers.fractalTrans.detach();
		//	// trackers.fractalTrans.destroy();
		//	// this.resetVenusVidSphere(String(user.id));
		//
		//	// Remove the entry from the map.
		//	this.userTrackers.delete(user.id);
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

  private loadSampleJSON () {
    return {
      "Triggers": {
        "Trigger1": {
          "displayName": "Trigger 1",
          "triggerType": "Box",
          "isVisibile":true,
          "triggerTransform": {
            "dimensions": {
              "x": 1.0,
              "y": 1.5,
              "z": 0.4
            },
            "scale": {
              "x": 1.005,
              "y": 1.005,
              "z": 1.005
            },
            "position": {
              "x": 10,
              "y": 1,
              "z": 5
            },
            "rotation": {
              "x": 0,
              "y": 0,
              "z": 0
            }
          },
          "triggeredOnEnter": {
            "killResources": [""],
            "spawnResources": [""]
          },
          "triggeredOnExit": {
            "killResources": ["Venus-Wings"],
            "spawnResources": [""]
          }
        }
      },
      "Artifacts": {
        "Venus-Wings": {
          "resourceId": "artifact:1862115330621440028",
          "displayName": "Venus-Wings",
          "attachPoint": "",
          "grabbable": true,
          "scale": {
            "x": 1,
            "y": 1,
            "z": 1
          },
          "position": {
            "x": 0,
            "y": 0.1,
            "z": -0.18
          },
          "rotation": {
            "x": -5,
            "y": 0,
            "z": 0
          },
          "menuScale": {
            "x": 0.75,
            "y": 0.75,
            "z": 0.75
          },
          "menuPosition": {
            "x": 4,
            "y": 1.5,
            "z": 0
          },
          "menuRotation": {
            "x": 0,
            "y": 180,
            "z": 0
          }
        },
        "Madhat-Deep-Purple": {
          "resourceId": "artifact:1880110261923217604",
          "attachPoint": "head",
          "displayName": "Madhat-Deep-Purple",
          "grabbable": "true",
          "scale": {
            "x": 1,
            "y": 1,
            "z": 1
          },
          "position": {
            "x": 1,
            "y": 2,
            "z": -1
          },
          "rotation": {
            "x": 180,
            "y": 0,
            "z": 180
          },
          "menuScale": {
            "x": 0.03,
            "y": 0.03,
            "z": 0.03
          },
          "menuPosition": {
            "x": 3,
            "y": 1.65,
            "z": 0
          },
          "menuRotation": {
            "x": 0,
            "y": 180,
            "z": 0
          }
        }
      },
      "SpawnAtStartup":["Madhat-Deep-Purple"],
      "MenuSetup":{
        "displayName": "Clear",
        "resourceId": "artifact:1947124567050814312",
        "options": {
          "previewMargin": 1.5
        },
        "menuScale": {
          "x": 0.3,
          "y": 0.3,
          "z": 0.3
        },
        "menuPosition": {
          "x": 0,
          "y": 1.65,
          "z": 0
        },
        "menuRotation": {
          "x": 0,
          "y": 0,
          "z": 0
        }
      }
    }
  }
}
