import { useMeta } from '@humanmade/block-editor-components';

import { BaseControl, ColorPalette } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { editorFrameReady } from './editor-ready';

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
	 * Function to get the editor wrapper element.
	 *
	 * @return {Element} Editor wrapper element.
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
	 * Function to update the class for the editor wrapper.
	 *
	 * @param {string|null} slug The slug of the selected color.
	 *
	 * @return {void}
	 */
	const updateEditorWrapperClass = ( slug ) => {
		// Get editor wrapper element.
		const editorWrapper = getEditorWrapper();
		if ( ! editorWrapper ) {
			return;
		}

		// Remove old color classnames from the editor wrapper.
		editorWrapper.className = editorWrapper.className.replace(
			/(?:^|\s)has-(.*)-color-palette(?!\S)/,
			''
		);

		// Add new color classname to the editor wrapper.
		if ( slug ) {
			editorWrapper.classList.add( `has-${ slug }-color-palette` );
		}
	};

	/**
	 * Function to get the slug of the current color.
	 *
	 * @param {string} colorValue The value of the selected color.
	 *
	 * @return {string|undefined} Color slug.
	 */
	const getSlug = ( colorValue ) => {
		const selectedColor = colorPaletteOptions.find(
			( element ) => element.color === colorValue
		);

		return selectedColor?.slug;
	};

	/**
	 * Function to get the value of the current color.
	 *
	 * @param {string} colorSlug The slug of the selected color.
	 *
	 * @return {string|undefined} Color value.
	 */
	const getValue = ( colorSlug ) => {
		const selectedColor = colorPaletteOptions.find(
			( element ) => element.slug === colorSlug
		);

		return selectedColor?.color;
	};

	/**
	 * Function to handle color change.
	 *
	 * @param {string|undefined} colorValue The value of the selected color or undefined.
	 *
	 * @return {void}
	 */
	const onColorChange = ( colorValue ) => {
		// Get the slug of the selected color value.
		const slug = colorValue ? getSlug( colorValue ) : null;

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
	const currentValue = currentSlug ? getValue( currentSlug ) : undefined;

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
	}, [ isBlock, currentSlug ] ); // eslint-disable-line react-hooks/exhaustive-deps

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
