import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import TextField from "@mui/material/TextField";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";
import { useTranslation } from "react-i18next"; // Import the translation hook
import './Editprofile.css';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
  maxWidth: "500px",
  width: "100%",
};

function EditChild({ dob, setDob }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation(); // Initialize the translation hook
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <div className="birthdate-section" onClick={handleOpen}>
        <span>{t("profile.edit")}</span> {/* Éditer */}
      </div>
      <Modal open={open} onClose={handleClose}>
        <Box sx={{ ...style, width: 300, height: 300 }}>
          <h2>{t("profile.editDob")}</h2> {/* Modifier la date de naissance */}
          <p>
            {t(
              "profile.editDobInstruction"
            )}{" "}
            {/* Cela ne peut être changé que quelques fois. Assurez-vous d'entrer l'âge correct de la personne utilisant le compte. */}
          </p>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
          <button onClick={handleClose}>{t("profile.cancel")}</button> {/* Annuler */}
        </Box>
      </Modal>
    </div>
  );
}

const EditProfileModal = ({ authUser }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    dob: "",
    link: "",
    newPassword: "",
    currentPassword: "",
  });
  const [open, setOpen] = useState(false);
  const { updateProfile, isUpdatingProfile } = useUpdateUserProfile();
  const { t } = useTranslation(); // Initialize the translation hook

  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName || "",
        username: authUser.username || "",
        email: authUser.email || "",
        bio: authUser.bio || "",
        location: authUser.location || "",
        website: authUser.website || "",
        dob: authUser.dob || "",
        link: authUser.link || "",
        newPassword: "",
        currentPassword: "",
      });
    }
  }, [authUser]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setOpen(false); // Close modal on success
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div>
      <button className="Edit-profile-btn" onClick={() => setOpen(true)}>
        {t("profile.editProfile")} {/* Modifier le profil */}
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style}>
          <div className="header">
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
            <h2 className="header-title">{t("profile.editProfile")}</h2> {/* Modifier le profil */}
            <button className="save-btn" onClick={handleSave}>
              {isUpdatingProfile
                ? t("profile.updating") /* Mise à jour... */
                : t("profile.save")} 
            </button>
          </div>
          <form className="flex flex-col gap-4">
            <TextField
              label={t("profile.fullName")} // Nom complet
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
            />
            <TextField
              label={t("profile.username")} // Nom d'utilisateur
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
            />
            <TextField
              label={t("profile.email")} // Email
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              type="email"
            />
            <TextField
              label={t("profile.bio")} // Bio
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              variant="outlined"
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label={t("profile.location")} // Localisation
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
            />
            <TextField
              label={t("profile.website")} // Site web
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              type="url"
            />
            <TextField
              label={t("profile.currentPassword")} // Mot de passe actuel
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              type="password"
            />
            <TextField
              label={t("profile.newPassword")} // Nouveau mot de passe
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              type="password"
            />
            <TextField
              label={t("profile.link")} // Lien
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              type="url"
            />
            <EditChild
              dob={formData.dob}
              setDob={(value) => setFormData({ ...formData, dob: value })}
            />
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default EditProfileModal;
