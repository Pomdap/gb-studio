import React, { useCallback, useEffect, useState } from "react";
import { paletteSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import { Palette } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import navigationActions from "store/features/navigation/navigationActions";
import { Button } from "ui/buttons/Button";
import { PlusIcon } from "ui/icons/Icons";
import entitiesActions from "store/features/entities/entitiesActions";
import { FlexGrow, FlexRow } from "ui/spacing/Spacing";
import PaletteBlock from "components/forms/PaletteBlock";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { EntityListItem } from "ui/lists/EntityListItem";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface NavigatorPalettesProps {
  height: number;
  selectedId: string;
}

interface PaletteNavigatorItem {
  id: string;
  name: string;
  isDefault: boolean;
  colors: string[];
}

const paletteToNavigatorItem = (palette: Palette): PaletteNavigatorItem => ({
  id: palette.id,
  name: palette.name,
  isDefault: !!palette.defaultColors,
  colors: palette.colors,
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (
  a: { id: string; name: string },
  b: { id: string; name: string }
) => {
  // Push default palettes to top of list
  const aName = a.id.startsWith("default") ? `_${a.name}` : a.name;
  const bName = b.id.startsWith("default") ? `_${b.name}` : b.name;
  return collator.compare(aName, bName);
};

const Pane = styled.div`
  overflow: hidden;
`;

export const NavigatorPalettes = ({
  height,
  selectedId,
}: NavigatorPalettesProps) => {
  const [items, setItems] = useState<PaletteNavigatorItem[]>([]);
  const allPalettes = useAppSelector((state) =>
    paletteSelectors.selectAll(state)
  );

  const dispatch = useAppDispatch();

  useEffect(() => {
    setItems(
      allPalettes
        .map((palette) => paletteToNavigatorItem(palette))
        .sort(sortByName)
    );
  }, [allPalettes]);

  const setSelectedId = useCallback(
    (id: string) => {
      dispatch(navigationActions.setNavigationId(id));
    },
    [dispatch]
  );

  const addNewPalette = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      dispatch(entitiesActions.addPalette());
    },
    [dispatch]
  );

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId]
  );

  const onRenamePaletteComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editPalette({
            paletteId: renameId,
            changes: {
              name,
            },
          })
        );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const renderContextMenu = useCallback(
    (item: PaletteNavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        ...(!item.isDefault
          ? [
              <MenuDivider key="div-delete" />,
              <MenuItem
                key="delete"
                onClick={() =>
                  dispatch(
                    entitiesActions.removePalette({
                      paletteId: item.id,
                    })
                  )
                }
              >
                {l10n("MENU_DELETE_PALETTE")}
              </MenuItem>,
            ]
          : []),
      ];
    },
    [dispatch]
  );

  const renderLabel = useCallback((item: PaletteNavigatorItem) => {
    return (
      <FlexRow>
        {item.name}
        <FlexGrow />
        <PaletteBlock colors={item.colors} size={16} />
      </FlexRow>
    );
  }, []);

  return (
    <Pane style={{ height }}>
      <SplitPaneHeader
        collapsed={false}
        buttons={
          <Button
            variant="transparent"
            size="small"
            title={l10n("FIELD_ADD_PALETTE")}
            onClick={addNewPalette}
          >
            <PlusIcon />
          </Button>
        }
      >
        {l10n("NAV_PALETTES")}
      </SplitPaneHeader>

      <FlatList
        selectedId={selectedId}
        items={items}
        setSelectedId={setSelectedId}
        height={height - 30}
        onKeyDown={listenForRenameStart}
      >
        {({ item }) => (
          <EntityListItem
            item={item}
            type={"palette"}
            rename={renameId === item.id}
            onRename={onRenamePaletteComplete}
            onRenameCancel={onRenameCancel}
            renderContextMenu={renderContextMenu}
            renderLabel={renderLabel}
          />
        )}
      </FlatList>
    </Pane>
  );
};
