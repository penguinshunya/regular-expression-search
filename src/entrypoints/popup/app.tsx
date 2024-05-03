import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Box,
  CircularProgress,
  IconButton,
  Input,
  Stack,
  Typography,
} from "@mui/material";
import React, { useCallback, useState } from "react";

export function App() {
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(() => {
    if (loading) return;
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1000);
  }, [loading]);

  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ pl: 0.5 }}>
      <Input
        autoFocus
        disableUnderline
        fullWidth
        sx={{ fontSize: 12 }}
        onInput={handleChange}
      />
      <Box sx={{ width: 64, display: "flex", justifyContent: "flex-end" }}>
        {loading ? (
          <CircularProgress size={12} />
        ) : (
          <Typography
            color="#333"
            fontSize={11}
            sx={{ userSelect: "none", whiteSpace: "nowrap" }}
          >
            10 / 20
          </Typography>
        )}
      </Box>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <IconButton size="small">
          <KeyboardArrowUpIcon sx={{ width: 16, height: 16 }} />
        </IconButton>
        <IconButton size="small">
          <KeyboardArrowDownIcon sx={{ width: 16, height: 16 }} />
        </IconButton>
        <IconButton size="small">
          <CloseIcon sx={{ width: 14, height: 14 }} />
        </IconButton>
      </Stack>
    </Stack>
  );
}
