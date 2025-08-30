# Disable git pager globally
git config --global core.pager ""

# First create a branch for our fixes
git branch dashboard-fixes

# Checkout the branch
git checkout dashboard-fixes

# Push to remote (image-upload-start branch)
git push origin dashboard-fixes:image-upload-start 