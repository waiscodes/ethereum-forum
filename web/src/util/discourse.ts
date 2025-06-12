const mapDiscourseInstanceUrl = (discourseId: string) => {
    switch (discourseId) {
        case 'magicians':
            return 'https://ethereum-magicians.org';
        case 'research':
            return 'https://ethresear.ch';
    }
};
