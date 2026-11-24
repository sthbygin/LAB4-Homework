const updateProfile = async (req, res, next) => {
    try {
        const { fullName, age, gender } = req.body;

        if (fullName !== undefined) req.user.fullName = fullName.trim();
        if (age !== undefined) req.user.age = Number(age);
        if (gender !== undefined) req.user.gender = gender;

        await req.user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: req.user
        });
    } catch (error) {
        next(error);
    }
};

const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please choose an image file!'
            });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        req.user.avatarUrl = fileUrl;
        await req.user.save();

        res.status(200).json({
            success: true,
            message: 'Avatar updated successfully',
            data: req.user
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateProfile,
    uploadAvatar
};
