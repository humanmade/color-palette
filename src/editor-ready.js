/**
 * Provide utilities for triggering behavior once the editor has initialized
 * to various degrees.
 *
 * Provides three progressive checkpoints, which fire in order:
 *   editorStoreReady:  The block editor store is populated and accessible
 *   editorBlocksReady: Post content is resolved in the store
 *   editorFrameReady:  The editor canvas iframe DOM is loaded
 *
 * All functions resolve immediately if the condition is already met.
 */

import { select, subscribe } from '@wordpress/data';

/**
 * Resolves when `core/block-editor` settings have been populated.
 *
 * The earliest useful signal; does not imply post content or iframe readiness.
 *
 * @return {Promise<Object>} Resolves with the block editor settings object.
 */
export function editorStoreReady() {
	return new Promise( ( resolve ) => {
		const isReady = () => {
			const settings = select( 'core/block-editor' ).getSettings();
			return settings && Object.keys( settings ).length > 0;
		};

		if ( isReady() ) {
			resolve( select( 'core/block-editor' ).getSettings() );
			return;
		}

		const unsubscribe = subscribe( () => {
			if ( isReady() ) {
				unsubscribe();
				resolve( select( 'core/block-editor' ).getSettings() );
			}
		} );
	} );
}

/**
 * Resolves when post content is ready for data access.
 *
 * Works with a clean new post or when blocks have been loaded and parded.
 *
 * More reliable than `__unstableIsEditorReady` for content readiness, as
 * of May 2026.
 *
 * Does not imply the editor iframe has been loaded, only that the blocks
 * are ready within the wp.data store.
 *
 * @return {Promise<void>}
 */
export function editorBlocksReady() {
	return new Promise( ( resolve ) => {
		const isReady = () =>
			select( 'core/editor' ).isCleanNewPost() ||
			select( 'core/block-editor' ).getBlockCount() > 0;

		if ( isReady() ) {
			resolve();
			return;
		}

		const unsubscribe = subscribe( () => {
			if ( isReady() ) {
				unsubscribe();
				resolve();
			}
		} );
	} );
}

/**
 * Resolves with the editor canvas <iframe> element once its DOM is loaded.
 *
 * Chains onto editorBlocksReady to ensure blocks are also ready in the store,
 * then waits for the `load` event on `iframe[name="editor-canvas"]`.
 *
 * @return {Promise<HTMLIFrameElement|null>} The canvas iframe, or null if not found.
 */
export async function editorFrameReady() {
	await editorBlocksReady();

	return new Promise( ( resolve ) => {
		const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );

		if ( ! iframe ) {
			resolve( null );
			return;
		}

		if ( iframe.contentDocument?.readyState === 'complete' ) {
			resolve( iframe );
			return;
		}

		iframe.addEventListener( 'load', () => resolve( iframe ), { once: true } );
	} );
}
