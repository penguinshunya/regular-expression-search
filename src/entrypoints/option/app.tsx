import { Grid, Stack, Switch, Typography } from "@mui/material";
import React from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { getStorageValue, setStorageValue } from "../../utils/functions";

export function App() {
  const getInstant = useSWR("instant", async () => {
    return getStorageValue("instant", false);
  });

  const toggleInstant = useSWRMutation("instant", async () => {
    return setStorageValue("instant", !getInstant.data);
  });

  const getIgnoreBlank = useSWR("ignoreBlank", async () => {
    return getStorageValue("ignoreBlank", false);
  });

  const toggleIgnoreBlank = useSWRMutation("ignoreBlank", async () => {
    return setStorageValue("ignoreBlank", !getIgnoreBlank.data);
  });

  const getBackground = useSWR("background", async () => {
    return getStorageValue("background", false);
  });

  const toggleBackground = useSWRMutation("background", async () => {
    return setStorageValue("background", !getBackground.data);
  });

  return (
    <Stack sx={{ p: 2 }} spacing={0.5}>
      <Grid container alignItems="center">
        <Grid item xs={9}>
          <Typography>即時検索</Typography>
        </Grid>
        <Grid item xs={3}>
          <Switch
            checked={getInstant.data}
            onChange={() => toggleInstant.trigger()}
          />
        </Grid>
      </Grid>
      <Grid container alignItems="center">
        <Grid item xs={9}>
          <Typography>空白文字の除外</Typography>
        </Grid>
        <Grid item xs={3}>
          <Switch
            checked={getIgnoreBlank.data}
            onChange={() => toggleIgnoreBlank.trigger()}
          />
        </Grid>
      </Grid>
      <Grid container alignItems="center">
        <Grid item xs={9}>
          <Typography>バックグラウンドで実行</Typography>
        </Grid>
        <Grid item xs={3}>
          <Switch
            checked={getBackground.data}
            onChange={() => toggleBackground.trigger()}
          />
        </Grid>
      </Grid>
      <Grid container alignItems="center">
        <Grid item xs={3}>
          <Typography>カラー</Typography>
        </Grid>
        <Grid item xs={9}>
          <Switch />
        </Grid>
      </Grid>
    </Stack>
  );
}
