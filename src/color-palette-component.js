import { useMeta } from '@humanmade/block-editor-components';

import { BaseControl, ColorPalette } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { editorFrameReady } from './editor-ready';

/**
 * Get the editor wrapper element.
 *
 * @return {Element|null} The editor canvas iframe body, or null if not yet available.
 */
const getEditorWrapper = () => {
	const editorIframe = document.querySelector(
		'iframe[name="editor-canvas"]'
	);
	if ( ! editorIframe ) {
		return null;
	}
	const editorDocument =
		editorIframe.contentDocument || editorIframe.contentWindow.document;
	return editorDocument?.body;
};

/**
 * Apply a color palette class to the editor canvas body, removing any prior one.
 *
 * @param {string|null} slug Color palette slug, or null to clear.
 * @return {void}
 */
const updateEditorWrapperClass = ( slug ) => {
	const editorWrapper = getEditorWrapper();
	if ( ! editorWrapper ) {
		return;
	}

	editorWrapper.className = editorWrapper.className.replace(
		/(?:^|\s)has-(.*)-color-palette(?!\S)/,
		''
	);

	if ( slug ) {
		editorWrapper.classList.add( `has-${ slug }-color-palette` );
	}
};

/**
 * Get the slug for a specific color from a palette.
 *
 * @param {Array}  colors     Palette color definitions.
 * @param {string} colorValue Hex color value.
 * @return {string|undefined} Matching color slug.
 */
const getSlug = ( colors, colorValue ) =>
	colors.find( ( { color } ) => color === colorValue )?.slug;

/**
 * Get the color from a palette by slug.
 *
 * @param {Array}  colors    Palette color definitions.
 * @param {string} colorSlug Color slug.
 * @return {string|undefined} Matching hex color value.
 */
const getValue = ( colors, colorSlug ) =>
	colors.find( ( { slug } ) => slug === colorSlug )?.color;

/**
 * HMColorPalette component.
 *
 * @param {Object} props - Component props.
 * @return {Element} Component.
 */
const HMColorPalette = ( props ) => {
	const colorPaletteOptions = window.themeColors;

	const { blockColorPalette, isBlock = true, setBlockColorPalette } = props;
	const [ documentColorPalette, setDocumentColorPalette ] = useMeta(
		'document_color_palette'
	);

	/**
	 * Function to handle color change.
	 *
	 * @param {string|undefined} colorValue The value of the selected color or undefined.
	 *
	 * @return {void}
	 */
	const onColorChange = ( colorValue ) => {
		// Get the slug of the selected color value.
		const slug = colorValue
			? getSlug( colorPaletteOptions, colorValue )
			: null;

		// User clicked "clear".
		if ( colorValue === undefined || colorValue === null || ! slug ) {
			if ( isBlock ) {
				if ( typeof setBlockColorPalette === 'function' ) {
					// null color palette is saved to the block attribute.
					setBlockColorPalette( null );
				}
			} else {
				// null color palette is saved to post metadata.
				setDocumentColorPalette( null );

				// Add/remove color classnames for the editor wrapper.
				updateEditorWrapperClass( null );
			}
			return;
		}

		if ( isBlock ) {
			// Save as a block attribute.
			setBlockColorPalette( slug );
		} else {
			// Save the selected color to post metadata.
			setDocumentColorPalette( slug );

			// Add/remove color classnames for the editor wrapper.
			updateEditorWrapperClass( slug );
		}
	};

	const currentSlug = isBlock ? blockColorPalette : documentColorPalette;
	const currentValue = currentSlug
		? getValue( colorPaletteOptions, currentSlug )
		: undefined;

	useEffect( () => {
		if ( isBlock ) {
			return;
		}

		let cancelled = false;

		editorFrameReady().then( () => {
			if ( ! cancelled ) {
				updateEditorWrapperClass( currentSlug );
			}
		} );

		return () => {
			cancelled = true;
		};
	}, [ isBlock, currentSlug ] );

	return (
		<BaseControl
			id="palette-settings-control"
			label={ __( 'Choose a Color Palette', 'hm-color-palette' ) }
		>
			<ColorPalette
				colors={ colorPaletteOptions }
				disableCustomColors
				value={ currentValue }
				onChange={ onColorChange }
			/>
		</BaseControl>
	);
};

export default HMColorPalette;
